---
title: "Building a Renderer From the Ground Up: How Helio Works"
date: "2026-04-08"
categories: ["Graphics", "Rust", "Engineering"]
tags: ["Renderer", "Helio", "wgpu", "PBR", "Deferred Rendering"]
cover: "helio-intro.png"
---

## What We're Actually Talking About

When you play a video game and a ray of light catches the edge of a wet cobblestone, or shadows stretch realistically across a room as the camera pans—that doesn't happen by magic. There's an elaborate piece of software running every single frame, typically 60 or more times per second, that takes a mathematical description of a 3D world and turns it into the 2D grid of colored pixels you see on your monitor. That software is called a renderer.

I've been building one. It's called **Helio**, and it's written in Rust on top of [wgpu](https://wgpu.rs/)—a cross-platform graphics API that runs on Vulkan, Metal, DirectX 12, and WebGPU. The goal was to build something production-grade: physically-based lighting, real shadows, global illumination, water simulation, temporal anti-aliasing, and the kind of per-frame performance guarantees that let you sleep at night knowing a frame won't spike to 200ms because someone added a few extra lights to a scene.

This post is a deep walk through how Helio works, from the moment you hand it a scene to the moment pixels appear on screen. It's written for people who don't necessarily have a graphics background. I'll explain the concepts, show you the real code, and be honest about why certain decisions were made.

---

## The Problem Space: What a Renderer Has to Do

Before we get into Helio specifically, it helps to understand what a renderer is actually being asked to solve. The core task sounds simple: given a camera position, a collection of 3D objects, and some lights, compute the color of every pixel in a 2D image.

In reality, that problem is enormous. A modern real-time scene might have thousands of individual objects, dozens of dynamic lights, complex materials with normal maps and roughness data, animated characters, transparent surfaces, water, atmospheric effects, and post-processing like bloom and anti-aliasing. You have roughly 16 milliseconds to produce one frame if you're targeting 60fps. That budget has to cover not just the rendering itself but also physics simulation, game logic, audio processing, and everything else the application is doing.

This means a renderer is fundamentally about intelligent shortcuts. Real-world light doesn't work the way game renderers simulate it—it bounces off every surface infinitely, arriving at your eye from every direction simultaneously. Simulating that accurately would take hours per frame. Instead, we use a collection of carefully-engineered approximations that look convincing at real-time speeds.

The challenge Helio was designed around is this: how do you build a renderer that's correct enough to look great, fast enough to run in real-time, and flexible enough that you can change parts of it without rebuilding everything? The answer is a **render graph**.

---

## The Render Graph: A Pipeline Built From Passes

The single most important architectural idea in Helio is the render graph. Instead of one monolithic rendering function that does everything in sequence, the renderer is structured as a series of discrete **passes**. Each pass is a self-contained unit of GPU work that reads some inputs, performs a specific operation, and writes some outputs.

```rust
pub struct RenderGraph {
    passes: Vec<Box<dyn RenderPass>>,
    // ...
}

impl RenderGraph {
    pub fn add_pass(&mut self, pass: Box<dyn RenderPass>) {
        self.passes.push(pass);
    }

    pub fn execute(&mut self, ctx: &PassContext) -> HelioResult<()> {
        for pass in &mut self.passes {
            pass.prepare(ctx)?;
            pass.execute(ctx)?;
        }
        Ok(())
    }
}
```

Every pass implements the `RenderPass` trait: a `prepare` method that runs on the CPU to upload data to the GPU, and an `execute` method that records GPU commands. Passes run in the order they were added to the graph. The outputs of early passes are consumed as inputs by later passes.

This architecture has several consequences that matter a lot in practice. First, it's modular—if you want to add screen-space ambient occlusion, you write a new pass and insert it at the right point in the graph. Second, it's replaceable—if you want a stripped-down pipeline for low-end devices, you build a `simple_graph` with fewer passes. Third, all the complexity is contained: a bug in shadow rendering lives entirely within the shadow pass, not scattered across a 3000-line rendering function.

Helio's default graph has about 16 passes that execute in a specific order. Let's walk through every one of them.

---

## Understanding the Scene: Handles, Buffers, and GPU Upload

Before we can render anything, we need to get our scene data onto the GPU. This is more subtle than it sounds.

The GPU is a separate processor with its own memory. Data lives either on the CPU (your RAM) or on the GPU (video RAM). Moving data between them is expensive. A naive renderer might upload every object's transform matrix every frame even if nothing moved. In a scene with 10,000 objects, that's a lot of unnecessary work.

Helio tracks what's changed using a **dirty flag** system. When you insert a mesh or change a light's position, that change is marked dirty. At the start of each frame, only dirty data gets uploaded to the GPU.

```rust
// Scene data is held in GrowableBuffer<T> — a GPU-resident storage buffer
// that automatically expands as you insert more objects.
pub struct GrowableBuffer<T: bytemuck::Pod> {
    buffer: wgpu::Buffer,
    data: Vec<T>,
    dirty: bool,
    generation: u64,    // incremented each time the buffer is (re)allocated
}

impl<T: bytemuck::Pod> GrowableBuffer<T> {
    pub fn flush(&mut self, queue: &wgpu::Queue) {
        if self.dirty {
            queue.write_buffer(&self.buffer, 0, bytemuck::cast_slice(&self.data));
            self.dirty = false;
        }
    }
}
```

The `generation` field is particularly clever. When a `GrowableBuffer` needs to expand because more objects were added, it allocates a new GPU buffer and increments the generation. Every pass that holds a reference to this buffer checks the generation before each frame and rebuilds its bind groups only when the buffer has been reallocated. This means bind group rebuilds—which are relatively expensive—happen at scene growth, not every frame.

The handle system follows from this. When you call `renderer.scene_mut().insert_mesh(mesh)`, you get back a `MeshId`—a typed wrapper around an integer index. That index is stable for the lifetime of the mesh. You use it to reference your mesh in other calls (attach a material to it, remove it, update its transform). The GPU side is an array of mesh descriptors, and your `MeshId` is just an index into that array. There are no raw pointers, no lifetimes to track, no double-free bugs.

```rust
// Creating a simple scene
let mesh_id = renderer.insert_mesh(MeshUpload { vertices, indices, bounding_sphere });
let mat_id  = renderer.insert_material(GpuMaterial {
    albedo: [0.8, 0.7, 0.6, 1.0],
    roughness: 0.4,
    metallic: 0.0,
    ..Default::default()
});
let obj_id  = renderer.insert_object(mesh_id, mat_id, Mat4::IDENTITY, GroupId::DEFAULT);
let light_id = renderer.insert_light(GpuLight::point(
    [2.0, 3.0, 1.0],      // position
    [1.0, 0.95, 0.9],     // color (slightly warm white)
    8.0,                   // intensity
    12.0,                  // range
));
```

This is the entire API surface for building a scene. It's deliberately minimal. The complexity lives inside the renderer, not in user code.

---

## Pass One: Shadow Matrix Computation

The first thing Helio does each frame is compute the view-projection matrices for every shadow-casting light. This is a compute pass that runs entirely on the GPU.

Shadow rendering works by rendering the scene from the light's perspective into a depth texture. Any geometry that can be "seen" from the light is lit; anything hidden from the light is in shadow. To render from the light's perspective, we need a transformation matrix that maps world-space positions into the light's clip space—exactly like a camera matrix, but for a light.

Point lights are complicated because they can cast light in all directions, so they need not one but six matrices (one per face of a cube). Directional lights use a technique called **Cascaded Shadow Maps (CSM)**, which splits the camera's view frustum into depth slices and renders each slice independently. This gives you high-resolution shadows near the camera and lower-resolution shadows far away, which matches how shadows look in the real world.

```rust
graph.add_pass(Box::new(ShadowMatrixPass::new(
    device,
    gpu_scene.lights.buffer(),
    gpu_scene.shadow_matrices.buffer(),
    camera_buf,
    &shadow_dirty_buf,
    &shadow_hashes_buf,
)));
```

The `shadow_dirty_buf` is a 64-byte storage buffer that the shadow matrix pass writes to. Each bit indicates whether the corresponding shadow face needs to be re-rendered this frame. If a light didn't move and no geometry near it changed, there's no reason to re-render its shadow map. The shadow pass reads this buffer and skips unchanged faces entirely.

The CSM split distances are negotiated between the shadow matrix pass and the G-buffer pass—both need to use the same values or shadows will appear at the wrong depth:

```rust
/// CSM cascade split distances — must match values used in shadow_matrices.wgsl.
/// These define the depth ranges for each shadow cascade:
///   Cascade 0: 0.1m – csm_splits[0] (close, high resolution)
///   Cascade 1: csm_splits[0] – csm_splits[1]
///   Cascade 2: csm_splits[1] – csm_splits[2]
///   Cascade 3: csm_splits[2] – csm_splits[3] (far, low resolution)
pub csm_splits: [f32; 4],
```

---

## Pass Two: The Shadow Atlas

With the matrices computed, the shadow pass actually renders geometry into shadow maps. The key concept here is the **shadow atlas**—rather than allocating a separate texture for each light, all shadow depth maps are packed into a single large texture array.


| Property     | Value                                        |
|--------------|----------------------------------------------|
| Format       | Depth32Float                                 |
| Resolution   | 1024 × 1024 pixels per face                  |
| Array layers | 256 (enough for 42 point lights × 6 faces)   |
| VRAM usage   | ~256 MB (constant, pre-allocated at startup) |

The atlas is allocated once at startup and never resized. This is a deliberate trade-off—256MB of VRAM is always reserved for shadows, whether the scene has one light or forty. The benefit is that there are no mid-frame allocations, no texture recreation, no GPU memory fragmentation. The budget is predictable and frame times are stable.

The shadow pass uses a depth-only pipeline—it doesn't output any color, just depth values. It also uses front-face culling (the opposite of normal rendering), which is a well-known technique from Unreal Engine 4 that eliminates **shadow acne**—the self-shadowing artifacts that appear when a surface's shadow map depth is very close to its own depth when sampled during lighting.

The entire shadow pass is controlled by a single `multi_draw_indexed_indirect` call per shadow face. All draw commands are generated on the GPU by previous passes; the CPU just triggers the execution. This is what makes the pass **O(1) on the CPU**—it doesn't matter if the scene has 10 objects or 10,000. The CPU overhead is constant.

```rust
graph.add_pass(Box::new(ShadowPass::new(
    device,
    Arc::clone(&shadow_dirty_buf),
)));
```

---

## Passes Three and Four: The Sky

If the scene has a sky configured, two sky-related passes run before anything else is drawn to the screen.

The first is the **Sky LUT Pass**—LUT standing for Look-Up Table. Computing physically-based atmospheric scattering in real time is expensive: you'd need to numerically integrate light scattered through air at every wavelength for every viewing direction. Instead, the sky LUT pass bakes this computation into a texture once per frame (or whenever lighting conditions change). Later passes that need to know the sky color at any direction just sample this texture.

The sky model used in Helio is a variant of the Bruneton atmospheric scattering model. The shader parameters capture the full physical description of the atmosphere:

```rust
pub struct ShaderSkyUniforms {
    pub sun_direction:      [f32; 3],   // normalized direction toward the sun
    pub sun_intensity:      f32,        // default: 22.0 (physically calibrated)
    pub rayleigh_scatter:   [f32; 3],   // wavelength-dependent Rayleigh scattering
    pub rayleigh_h_scale:   f32,        // atmosphere scale height for Rayleigh
    pub mie_scatter:        f32,        // Mie (aerosol) scattering coefficient
    pub mie_h_scale:        f32,        // atmosphere scale height for Mie
    pub mie_g:              f32,        // Mie asymmetry factor (forward scattering bias)
    pub sun_disk_cos:       f32,        // cos(angular radius of sun disk): 0.9998
    pub earth_radius:       f32,        // in km: 6360.0
    pub atm_radius:         f32,        // in km: 6420.0
    pub exposure:           f32,        // HDR exposure compensation
    // ... cloud parameters
}
```

Rayleigh scattering is what makes the sky blue—short wavelengths (blue) scatter more than long wavelengths (red), so when you look away from the sun, you see scattered blue light. Mie scattering is what makes the sun appear white and causes the halo around it. The sky LUT pre-integrates both effects into a lookup texture indexed by view angle and sun elevation. The actual `SkyPass` then samples this LUT to render the sky dome in a single fullscreen draw, costing almost nothing per-frame.

```rust
let sky_lut_pass = SkyLutPass::new(device, camera_buf);
let sky_lut_view = sky_lut_pass.sky_lut_view.clone();
graph.add_pass(Box::new(sky_lut_pass));

graph.add_pass(Box::new(SkyPass::new(
    device,
    camera_buf,
    &sky_lut_view,
    config.internal_width(),
    config.internal_height(),
    config.surface_format,
)));
```

---

## Pass Five: Debug Overlays (Pre-Geometry)

Helio maintains a debug draw API that lets you draw lines, circles, spheres, frustums, and other shapes in world space. This is invaluable for development: you can visualize bounding boxes, see where your lights are, draw the path of a raycast, visualize camera frustums for shadow debugging.

The debug draw system runs twice per frame: once before the main geometry (so debug shapes can appear behind objects), and once at the very end (so they can appear in front of everything, regardless of depth). The first draw pass happens here, before the G-buffer or depth prepass.

```rust
graph.add_pass(Box::new(DebugDrawPass::new(
    device,
    debug_camera_buf,
    config.surface_format,
    debug_state.clone(),
    false,  // depth_test: false = draw over everything
    true,   // pre-geometry pass
)));
```

From user code, the API looks like this:

```rust
// Draw a wireframe sphere around an object's bounding volume
renderer.debug_sphere([x, y, z], radius, [1.0, 0.0, 0.0, 1.0], 24);

// Draw a camera frustum (useful for shadow cascade debugging)
renderer.debug_frustum(eye, forward, up, fov_y, aspect, near, far, [0.0, 1.0, 0.0, 1.0]);

// Draw an arbitrary line in world space
renderer.debug_line([0.0, 0.0, 0.0], [5.0, 0.0, 0.0], [1.0, 1.0, 0.0, 1.0]);
```

The debug state is protected by a `Mutex` because it can be written from any thread. The pass reads it once per frame, uploads the lines as a flat vertex buffer, and draws them with a simple unlit shader. Editor mode also uses the billboard pass (covered later) to render spotlight icons at light positions, which is what you see when editing a scene.

---

## Pass Six: Occlusion Culling

Before we draw any geometry for real, we want to know which objects are actually visible from the camera. Objects that are completely hidden behind other geometry don't need to be rendered at all—they'll contribute nothing to the final image, and processing them wastes both CPU and GPU time.

Helio uses **GPU-driven occlusion culling** based on a hierarchical Z-buffer (Hi-Z). The algorithm is temporal: it uses the depth information from the *previous* frame to test visibility for the *current* frame. This works because in most scenes, visibility doesn't change dramatically from frame to frame.

```rust
graph.add_pass(Box::new(OcclusionCullPass::new(
    device,
    hiz_view,          // Hi-Z pyramid from the previous frame
    hiz_sampler,
)));
```

The occlusion cull compute shader runs with one thread per draw slot. For each object, it:

1. Projects the object's bounding sphere center into normalized device coordinates (NDC)—the screen-space coordinate system where the screen goes from -1 to +1 in both X and Y.
2. Computes the screen-space radius of the bounding sphere, then picks the appropriate mip level of the Hi-Z pyramid that corresponds to that footprint.
3. Samples the Hi-Z pyramid depth at that location—which stores the *farthest* depth value in the previous frame at that screen area.
4. If the object's nearest depth is farther than the Hi-Z sample, the object is behind something and can be culled. The pass writes a zero into the object's indirect draw command, making the draw call a no-op.

The critical data structure here is the `indirect draw buffer`. Instead of the CPU issuing one draw call per object, objects are rendered via `multi_draw_indexed_indirect`. The GPU reads an array of draw parameters (vertex count, instance count, first index, etc.) and executes all of them in one submission. The instance count field serves double duty as a visibility flag: 1 means visible, 0 means culled. The occlusion pass writes these flags before the actual geometry passes run.

```rust
#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct CullParams {
    screen_width:  u32,
    screen_height: u32,
    total_slots:   u32,
    hiz_mip_count: u32,
}
```

---

## Pass Seven: The Depth Prepass

With culling done, the first real geometry pass executes: the **depth prepass**.

The depth prepass renders all visible geometry to the depth buffer *without* computing any lighting or material properties. It just writes depth. This costs less GPU time than a full render because the fragment shader is trivial—it doesn't sample any textures, doesn't compute lighting, just discards or accepts fragments based on geometry.

Why bother? Because of a problem called **overdraw**. In a naive renderer, the color of each pixel is computed for every geometry fragment that covers it. If you have four objects stacked behind each other, you compute lighting four times but only display the result for the front-most object—three computations wasted.

After the depth prepass, the depth buffer contains the exact depth of the nearest surface at every pixel. Subsequent passes can use early depth testing: before running the fragment shader for any geometry, the GPU compares the fragment's depth to the depth buffer. If the fragment is farther away (it's behind something), the fragment shader never runs. This converts overdraw from a correctness problem into a pure performance optimization.

For the deferred lighting approach Helio uses (more on this below), the depth prepass depth buffer is also needed as an input to multiple later passes—shadow comparisons, SSAO, TAA reprojection, and more.

```rust
graph.add_pass(Box::new(DepthPrepassPass::new(
    device,
    wgpu::TextureFormat::Depth32Float,
)));
```

---

## Pass Eight: Hi-Z Pyramid Build

After the depth prepass writes the depth buffer, the **Hi-Z Build Pass** takes that depth texture and constructs a hierarchical mip chain from it.

The standard depth buffer is just a flat 2D texture—every pixel stores the depth of the nearest surface. The Hi-Z pyramid adds mip levels, where each successive mip stores the *maximum* (farthest) depth value in the corresponding 2×2 region of the level below.

```
Mip 0:  Full resolution depth (from depth prepass)
Mip 1:  Half resolution — each texel = max(2×2 block from Mip 0)
Mip 2:  Quarter resolution — each texel = max(2×2 block from Mip 1)
...
Mip N:  1×1 — the single farthest depth value in the entire scene
```

This structure is useful for the occlusion culling pass (which uses it *next* frame), and also useful for any shader that needs to ask "is there anything blocking this region of the screen?" without sampling every depth texel individually.

The build is a two-phase compute dispatch:

```rust
// Phase 1: copy from Depth32Float to R32Float (because Depth32Float
// cannot be bound as a storage texture for writing)
copy_pipeline.dispatch(...);

// Phase 2: iteratively downsample with max-reduction
for mip in 1..mip_count {
    mip_pipeline.dispatch_workgroups(
        mip_width.div_ceil(WORKGROUP_SIZE),
        mip_height.div_ceil(WORKGROUP_SIZE),
        1,
    );
}
```

The pass is skipped if the camera hasn't moved since the last frame—since the Hi-Z is used *next* frame anyway, there's no point regenerating it if the scene is static.

```rust
graph.add_pass(Box::new(hiz_pass));
```

---

## Pass Nine: Tiled Light Culling

The tiled light culling pass solves a classic problem in real-time graphics: how do you efficiently render many dynamic lights without testing every light against every pixel?

The brute-force approach is to iterate over every light for every pixel. With 64 lights and a 1920×1080 screen, that's about 132 million light evaluations per frame—just for the lighting, before any shadow lookups. That's far too much.

Helio uses the **Forward+** tiled culling technique. The algorithm:

1. Divide the screen into 16×16 pixel tiles.
2. Run a compute shader that tests each light's sphere of influence against each tile's view frustum.
3. For each tile, build a list of which lights affect it.
4. In the lighting pass, each pixel only evaluates the lights that affect its tile.

```rust
pub const TILE_SIZE: u32 = 16;
pub const MAX_LIGHTS_PER_TILE: u32 = 64;

// Per-tile output buffers (published to FrameResources for use by DeferredLightPass):
// tile_light_lists[tile_idx * MAX_LIGHTS_PER_TILE + i] → light index i
// tile_light_counts[tile_idx] → how many lights affect this tile
pub tile_light_lists:  wgpu::Buffer,
pub tile_light_counts: wgpu::Buffer,
```

In a typical indoor scene, each tile might be affected by 2–6 lights. The deferred lighting pass only evaluates those lights—not all 64. This is where the performance gains come from.

The cull pass also has a cache: if the camera generation and lights generation haven't changed since last frame, the cull results are already valid and the compute dispatch is skipped entirely. In a static scene, this is effectively free.

```rust
graph.add_pass(Box::new(LightCullPass::new(
    device,
    config.internal_width(),
    config.internal_height(),
)));
```

---

## Pass Ten: The G-Buffer

The **G-Buffer pass** is the heart of Helio's deferred rendering approach, and it's worth spending real time on because it's a different way of thinking about rendering from the traditional forward approach.

In forward rendering, you draw each object and compute its full lighting immediately: for each fragment, evaluate all lights, compute the material response, output the final color. It's straightforward but has one major flaw: you can only render each scene with a fixed-function mesh-per-draw-call approach, and your shading is coupled to your geometry.

Deferred rendering decouples geometry from shading. In the G-buffer pass, we draw all opaque geometry but *don't* compute any lighting. Instead, we write the raw material and surface properties to a set of render targets:

```
| Slot | Name     | Format        | Contents                              |
|------|----------|---------------|---------------------------------------|
| 0    | albedo   | Rgba8Unorm    | base color RGB + alpha                |
| 1    | normal   | Rgba16Float   | world-space normal XYZ + F0.r         |
| 2    | orm      | Rgba8Unorm    | ambient occlusion, roughness, metallic|
| 3    | emissive | Rgba16Float   | emissive color RGB + F0.b             |
```

After the G-buffer pass, these four textures contain a complete description of the visible surface at every pixel—position is reconstructable from depth + the camera matrix, normals tell lighting which way the surface faces, and the ORM texture gives us the PBR material parameters.

The pass is fully GPU-driven with a single `multi_draw_indexed_indirect` call. All draw parameters were already prepared by the occlusion pass. CPU overhead is constant regardless of scene size:

```rust
graph.add_pass(Box::new(GBufferPass::new(
    device,
    config.internal_width(),
    config.internal_height(),
)));
```

The material system uses **bindless textures**—a 256-slot texture array that all materials share. Instead of each material binding its own textures, a material just stores integer indices pointing into the shared array. This eliminates bind group switches between draw calls entirely. All 256 textures are bound once at the start of the G-buffer pass, and every draw reads from them via indices stored in the material buffer:

```rust
// Group 1: bindless material data
// binding 0: materials storage buffer (array of GpuMaterial)
// binding 1: material_textures (MaterialTextureData — indices into the texture array)
// binding 2: scene_textures[MAX_TEXTURES] (the 256-slot texture array)
// binding 3: scene_samplers[MAX_TEXTURES] (samplers for each texture slot)
```

The PBR material struct is compact:

```rust
#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
pub struct GpuMaterial {
    pub albedo:             [f32; 4],   // base color + alpha
    pub roughness:          f32,        // 0 = mirror, 1 = completely diffuse
    pub metallic:           f32,        // 0 = dielectric, 1 = metal
    pub emissive_intensity: f32,        // multiplier on the emissive texture
    pub _pad:               f32,
}
```

---

## Pass Eleven: Virtual Geometry

The virtual geometry pass handles objects that benefit from level-of-detail or GPU-generated geometry, as well as debug visualization modes that expose internal geometry data.

This pass sits between the G-buffer pass and the lighting pass, in the same geometry-to-G-buffer slot. It can be toggled into different debug modes via the renderer config:

```rust
let mut vg_pass = VirtualGeometryPass::new(device, camera_buf);
vg_pass.debug_mode = config.debug_mode;
graph.add_pass(Box::new(vg_pass));
```

The debug mode is propagated from the renderer config—the same mode that affects the deferred lighting pass. Setting `renderer.set_debug_mode(10)` enables shadow heatmap visualization; mode 11 shows light depth. Virtual geometry debug modes show tessellation patterns, LOD boundaries, and cluster boundaries.

---

## Pass Twelve: Deferred Lighting

This is where the scene goes from a collection of data textures to something that looks like a rendered image.

The deferred lighting pass reads the G-buffer (the four textures generated in pass ten) plus the shadow atlas (from pass two), the sky LUT (from passes three/four), the tile light lists (from pass nine), and the radiance cascades global illumination texture. It evaluates physically-based lighting for every pixel and outputs the result to a **pre-TAA HDR texture**.

The lighting evaluation uses the **Cook-Torrance BRDF** (bidirectional reflectance distribution function), the industry-standard model for physically-based rendering:

The diffuse component is Lambertian: `diffuse = albedo / π`. The specular component is where most of the physics lives: Fresnel reflection (how much light reflects vs. refracts based on angle), a distribution function for microfacet normals (roughness), and a geometry function that accounts for self-shadowing of microsurface features.

For each pixel, the lighting shader:

1. Reconstructs world position from depth + inverse view-projection matrix.
2. Reads albedo, normal, roughness, metallic from the G-buffer.
3. Determines which light list tile this pixel belongs to.
4. For each light in that tile: evaluates BRDF, checks the shadow atlas for occlusion, adds the contribution.
5. Adds ambient lighting from the radiance cascades GI texture.
6. Adds emissive from the G-buffer emissive slot.
7. Outputs the HDR result.

```rust
let mut deferred_light_pass = DeferredLightPass::new(
    device,
    queue,
    camera_buf,
    config.internal_width(),
    config.internal_height(),
    config.surface_format,
);
deferred_light_pass.set_shadow_quality(config.shadow_quality, queue);
deferred_light_pass.debug_mode = config.debug_mode;
graph.add_pass(Box::new(deferred_light_pass));
```

Shadow quality affects how many PCF (percentage-closer filtering) samples are taken around each shadow map lookup. More samples produce softer, more accurate shadow edges at higher GPU cost:

```rust
pub enum ShadowQuality {
    Low,    // 1 sample — hard shadows, fastest
    Medium, // 4 samples — slightly soft
    High,   // 9 samples — smooth penumbra at medium cost
    Ultra,  // 16 samples — best quality, most expensive
}
```

The `DeferredLightPass` struct maintains extensive internal state to manage its bind groups efficiently:

```rust
// Bind group 1 covers G-buffer inputs (albedo, normal, orm, emissive, depth).
// Key: (albedo_ptr, normal_ptr, orm_ptr, emissive_ptr, depth_ptr, camera_ptr)
// Rebuilt only when any of these textures change (i.e., on resize).
bind_group_1_key: Option<(usize, usize, usize, usize, usize, usize)>,

// Bind group 2 covers shadow atlas, light data, tile lists.
// Key: tracks shadow atlas, lights buffer, etc.
bind_group_2_key: Option<(usize, usize, usize, usize, usize, usize, usize)>,
```

Each bind group is a compiled object on the GPU side. Creating one involves a small but non-zero cost. By caching them and rebuilding only when buffer pointers change, Helio avoids recreating bind groups every frame.

---

## Pass Thirteen: Billboards

Editor mode in Helio makes light sources visible—you can see where they are and select them. This is done with the **billboard pass**, which renders sprites that always face the camera.

A billboard is a quad (two triangles) that's oriented to face the camera no matter where the camera is. The spotlight icon texture is embedded at compile time:

```rust
static SPOTLIGHT_PNG: &[u8] = include_bytes!("../../../../spotlight.png");

let spotlight = image::load_from_memory(SPOTLIGHT_PNG)
    .unwrap_or_else(|_| image::DynamicImage::new_rgba8(1, 1))
    .into_rgba8();
let (sw, sh) = spotlight.dimensions();

let mut billboard_pass = BillboardPass::new_with_sprite_rgba(
    device,
    queue,
    camera_buf,
    config.surface_format,
    spotlight.as_raw(),
    sw,
    sh,
);
billboard_pass.set_occluded_by_geometry(true);
graph.add_pass(Box::new(billboard_pass));
```

Setting `occluded_by_geometry(true)` means the billboard icon disappears when the light is hidden behind a wall—exactly the behavior you'd expect from an editor tool. The billboard pass reads the depth buffer from the depth prepass and discards fragments that fail the depth test.

Billboards only appear when `GroupId::EDITOR` is visible, which only happens in editor mode. Normal rendering hides this group entirely:

```rust
renderer.set_editor_mode(true);   // shows editor overlays
renderer.set_editor_mode(false);  // hides them — no performance cost
```

---

## Pass Fourteen: Water Simulation

The water simulation pass is one of the most self-contained and interesting parts of the pipeline. It bundles a complete fluid simulation, caustics projection, and surface rendering into a single pass that writes into the pre-TAA texture before anti-aliasing runs.

The simulation uses a **shallow-water wave equation** on a 256×256 heightfield. Two ping-pong textures store the current and previous wave states. Each simulation step propagates waves using a finite difference approximation of the wave equation, with configurable parameters:

```rust
#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct DeltaUniform {
    delta:         [f32; 2],   // simulation step direction
    spring:        f32,        // wave spring constant (1.0 = fluid, 2.0 = jelly)
    damping:       f32,        // per-step energy damping (lower = waves persist longer)
    wind_dir:      [f32; 2],   // XZ wind direction, pre-normalized
    wind_strength: f32,        // 0 = calm, higher = choppier
    time:          f32,        // used to scroll wind noise pattern
    wave_scale:    f32,        // 1.0 = default, 0.25 = fine ripples, 2.0 = huge swells
    time_step:     f32,
}
```

Two simulation steps run per frame (for stability). After the simulation, normal vectors are recomputed from the updated heightfield, then caustics are projected: light filtered through the wavy surface creates bright caustic patterns on the pool floor. These are accumulated into a separate caustics texture and provided to the deferred lighting pass as a light modifier.

The surface render handles both above-water and below-water views. Above water, a Fresnel term blends between the reflected sky and the refracted underwater scene. Below water, the view is tinted and distorted by the wave heightfield.

The interaction system deserves mention: you can push ripples into the simulation from CPU code, which enables interactive water:

```rust
renderer.water_drop([x, z], radius, strength);   // create a ripple at world position
```

And hitbox objects (AABB volumes) can displace the water surface as objects enter or exit the water.

```rust
graph.add_pass(Box::new(WaterSimPass::new(
    device,
    camera_buf,
    config.internal_width(),
    config.internal_height(),
    config.surface_format,
)));
```

---

## Pass Fifteen: Temporal Anti-Aliasing

The penultimate rendering pass is temporal anti-aliasing, and it's worth understanding what problem it actually solves.

Without anti-aliasing, the edge of a triangle looks jagged—this is **aliasing**, and it happens because the triangle's edge cuts across pixel boundaries in non-integer ways but each pixel can only be fully on or off. The classic solution, MSAA (multisample anti-aliasing), renders at a higher resolution and downsamples—effective, but expensive because it scales memory and shading work.

TAA takes a different approach: instead of increasing resolution, it accumulates samples across multiple frames. Each frame, a tiny subpixel **jitter** is added to the camera's projection matrix. The jitter follows a Halton sequence—a low-discrepancy quasi-random series that efficiently covers the subpixel area:

```rust
const HALTON_JITTER: [[f32; 2]; 16] = [
    [0.500000, 0.333333],
    [0.250000, 0.666667],
    [0.750000, 0.111111],
    // ... 13 more entries
];

// Applied each frame as a tiny translation to the projection matrix
let jitter = HALTON_JITTER[frame_num % 16];
let jx = ((jitter[0] - 0.5) * 2.0) / (width as f32);
let jy = ((jitter[1] - 0.5) * 2.0) / (height as f32);
let jitter_matrix = Mat4::from_translation(Vec3::new(jx, jy, 0.0));
let jittered_proj = jitter_matrix * camera.projection;
```

Over 16 frames, each point on an edge has been sampled from 16 slightly different subpixel positions. TAA blends the current frame with a history buffer using **velocity-based reprojection**: for each pixel, move backward along the velocity vector to find where that pixel was in the previous frame, sample the history texture there, and blend the two.

The reprojection prevents ghosting when objects move—without it, fast objects would leave smear trails because the history buffer would be sampled at the wrong location. When reprojection fails (pixels near newly visible areas, fast-moving edges), TAA applies **variance clamping** in YCoCg color space to constrain how much the historical sample can deviate from the current frame's neighborhood.

```rust
#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct TaaUniform {
    feedback_min: f32,   // minimum blend weight toward history
    feedback_max: f32,   // maximum blend weight toward history
    jitter:       [f32; 2],
    reset:        u32,   // 1 on first frame — skip history blend
    _pad:         u32,
}
```

After the TAA resolve, a **spatial sharpening pass** runs on the output. This is the same idea as AMD CAS (Contrast Adaptive Sharpening): an unsharp mask that adaptively reduces sharpening on already-sharp edges and boosts it on smooth regions that lost fine detail to the temporal low-pass filter.

```
sharpened = center + (center - blur) * strength * (1 - 2 * local_contrast)
```

Critically, the sharpening is only applied to the output—never to the history buffer. Sharpening the history would amplify ringing artifacts over multiple frames; keeping history unsharpened preserves temporal stability while still recovering mesh detail in the final image. This follows the same design used by Unreal Engine's TSR and Unity HDRP.

```rust
graph.add_pass(Box::new(TaaPass::new(
    device,
    config.internal_width(),
    config.internal_height(),
    config.width,
    config.height,
    config.surface_format,
)));
```

---

## Pass Sixteen: Performance Overlay

The last pass before the final debug draw is the performance overlay—a real-time display of per-pass GPU timing data.

Throughout the pipeline, `PerfOverlayAnalyzerPass` instances are inserted between the rendering passes. Each one captures GPU timestamp queries around the work that just completed. The `PerfOverlayCostAnalyzerPass` variants estimate shader cost using pixel counting heuristics.

The final `PerfOverlayPass` collects all this data and renders it to the screen if enabled:

```rust
let mut perf_overlay_pass = PerfOverlayPass::new(
    device,
    Arc::clone(&perf_overlay_shared),
    config.surface_format,
);
perf_overlay_pass.set_mode(config.perf_overlay_mode);
graph.add_pass(Box::new(perf_overlay_pass));
```

The `perf_overlay_mode` can show raw GPU timings, cost estimates, or be disabled entirely. This is invaluable when profiling a scene: you can immediately see which passes are expensive and in what proportion.

If the `live-portal` feature is enabled, Helio also starts a local web server at `127.0.0.1:3030` and streams profiling telemetry to it in real time. This gives you a browser-based performance dashboard with per-pass timing history, without needing to run an external profiling tool.

---

## Pass Seventeen: Final Debug Draw

The last pass is a second `DebugDrawPass`—this time without depth testing. This is where final debug overlays that should appear on top of everything else are rendered: text labels, selection highlights, UI-space geometry.

```rust
graph.add_pass(Box::new(DebugDrawPass::new(
    device,
    debug_camera_buf,
    config.surface_format,
    debug_state.clone(),
    false,
    false,  // post-geometry pass — renders on top of everything
)));
```

The two debug passes bracket the entire rendering pipeline. The first draws with depth testing (overlays appear behind geometry); the last draws without (overlays appear in front of everything).

---

## The Render Scale System

One feature worth explaining is the **render scale**. Helio distinguishes between `internal_width/height` (the resolution at which 3D rendering happens) and `output_width/height` (the resolution of the display surface).

When `render_scale < 1.0`, the G-buffer, lighting, TAA, and effects run at a lower resolution. The TAA pass then upscales the result to the output resolution during its blit pass. This effectively gives you a form of dynamic resolution scaling:

```rust
renderer.set_render_scale(0.75);  // render at 75% resolution, upscale to output
```

At `render_scale = 0.75` with a 1920×1080 display, the 3D rendering happens at 1440×810 but output appears at 1080p. Memory bandwidth and fragment shader work scales with the internal resolution, so this can reclaim significant performance on demanding scenes at modest visual cost (TAA's sharpening pass recovers some of the lost detail).

When the render scale is less than 1.0, a separate full-resolution depth texture is allocated for the upscale blit, since the deferred output must be composited at native resolution correctly.

---

## Baking: Pre-Computed Light Data

For scenes where lighting is largely static, Helio supports a **baking workflow** that pre-computes expensive lighting data and caches it to disk.

```rust
// Simplest usage: auto-extract static geometry from the scene and bake
renderer.auto_bake(BakeConfig::fast("my_scene_cache"));

// Or with full control:
let scene_geom = renderer.scene().build_static_bake_scene();
renderer.configure_bake(BakeRequest {
    scene: scene_geom,
    config: BakeConfig {
        scene_name: "my_scene".to_string(),
        cache_dir: PathBuf::from("./bake_cache"),
        // quality settings...
    },
});
```

Baking runs once, blocking before the first rendered frame. It calculates ambient occlusion, lightmaps, and radiance probe data for static geometry. The results are injected into the SSAO pass (replacing per-frame screen-space AO with the baked version) and published to all passes via `FrameResources`.

The cache is file-based: subsequent runs with the same scene name load from disk instead of recomputing. This means baking is a one-time startup cost that pays off over many subsequent frames.

---

## Customizing the Pipeline

One of Helio's explicit design goals is that the render graph should be customizable. There are three levels of customization available.

The simplest is calling `renderer.use_simple_graph()`, which switches to a stripped-down pipeline suitable for low-end hardware or simple previews. It skips shadows, GI, water, TAA, and most effects.

The second level is adding custom passes to an existing graph:

```rust
// Add a custom pass after construction
renderer.add_pass(Box::new(MyCustomPass::new()));

// Or access an existing pass to reconfigure it
if let Some(pass) = renderer.find_pass_mut::<DeferredLightPass>() {
    pass.set_shadow_quality(ShadowQuality::Ultra, &queue);
}
```

The third level is building an entirely custom graph:

```rust
let builder: CustomGraphBuilder = Arc::new(|device, queue, scene, config, debug_state, debug_buf| {
    let mut graph = RenderGraph::new(device, queue);
    // add exactly the passes you need
    graph.add_pass(Box::new(ShadowPass::new(device, shadow_dirty_buf)));
    graph.add_pass(Box::new(GBufferPass::new(device, config.width, config.height)));
    // ...
    graph
});

renderer.set_graph_custom(initial_graph, config, builder);
```

The builder function is called whenever the renderer needs to rebuild the graph (e.g., on resize). This is how you make a fully custom pipeline that handles resolution changes correctly.

---

## Cross-Platform and WebAssembly

Helio runs on Vulkan (Linux, Android), Metal (macOS, iOS), DirectX 12 (Windows), and WebGPU (browser via WebAssembly). The `wgpu` abstraction layer handles backend differences.

The one concrete platform divergence in the code is the bindless texture array size:

```rust
// Bindless texture array — capped at 16 on WebGPU (baseline limit);
// 256 on native backends (Vulkan/Metal/DX12).
#[cfg(not(target_arch = "wasm32"))]
const MAX_TEXTURES: usize = 256;

#[cfg(target_arch = "wasm32")]
const MAX_TEXTURES: usize = 16;
```

WebGPU's baseline spec limits texture array bindings to 16 per stage. On native, the driver typically supports 256 or more. Helio adjusts this at compile time so the same codebase works on both targets.

Certain optional features are only enabled when the adapter supports them. Helio queries these at startup:

```rust
pub fn required_wgpu_features(adapter_features: wgpu::Features) -> wgpu::Features {
    let mut required = wgpu::Features::TEXTURE_BINDING_ARRAY
        | wgpu::Features::SAMPLED_TEXTURE_AND_STORAGE_BUFFER_ARRAY_NON_UNIFORM_INDEXING;

    // Optional: GPU-driven multi-draw commands (major perf boost on supported hardware)
    if adapter_features.contains(wgpu::Features::MULTI_DRAW_INDIRECT) {
        required |= wgpu::Features::MULTI_DRAW_INDIRECT;
    }
    if adapter_features.contains(wgpu::Features::MULTI_DRAW_INDIRECT_COUNT) {
        required |= wgpu::Features::MULTI_DRAW_INDIRECT_COUNT;
    }
    required
}
```

`MULTI_DRAW_INDIRECT` is the feature that enables GPU-driven rendering—issuing all draw calls in one GPU command. On hardware that doesn't support it, Helio falls back to individual draw calls from the CPU. The pipeline still works; it's just somewhat less efficient.

---

## Why Rust?

This post has been heavy on graphics concepts, but Rust as the implementation language is worth addressing directly, because the choice shaped the architecture significantly.

Rust's ownership model enforces that there's always exactly one owner for any piece of GPU state. In a renderer, managing GPU resource lifetimes is notoriously difficult. Textures, buffers, and pipelines must survive exactly as long as they're needed—drop them too early and you get GPU crashes; hold them too long and you waste VRAM. In C++, this is done with reference counting or careful manual lifecycle management. In Rust, the borrow checker enforces it structurally.

`Arc<wgpu::TextureView>` appears throughout the codebase—the HiZ build pass and occlusion cull pass share ownership of the Hi-Z texture view:

```rust
// HiZBuildPass owns the texture and exposes an Arc to the view
pub hiz_view: Arc<wgpu::TextureView>,
pub hiz_sampler: Arc<wgpu::Sampler>,

// OcclusionCullPass holds its own Arc reference
graph.add_pass(Box::new(OcclusionCullPass::new(
    device,
    Arc::clone(&hiz_pass.hiz_view),
    Arc::clone(&hiz_pass.hiz_sampler),
)));
```

Without `Arc`, this would require either copying the texture (expensive) or carefully managing which pass owns it (error-prone). With `Arc`, both passes hold a reference-counted pointer, and the texture is freed when the last reference drops. The borrow checker guarantees no pass holds a dangling reference to a freed texture.

The `bytemuck` crate handles safe GPU data uploads. Rather than manually casting Rust structs to `&[u8]` (which is unsound for arbitrary types), `bytemuck::cast_slice` only compiles if the type implements `Pod` (plain old data—no padding, no interior pointers, no destructors). The derive macros `#[derive(Pod, Zeroable)]` that appear on every GPU-facing struct are saying: "this struct is safe to reinterpret as raw bytes," which is the only way to safely pass Rust data to the GPU.

```rust
#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
pub struct GpuMaterial {
    pub albedo:             [f32; 4],
    pub roughness:          f32,
    pub metallic:           f32,
    pub emissive_intensity: f32,
    pub _pad:               f32,
}

// This is safe because GpuMaterial: Pod
queue.write_buffer(&material_buf, 0, bytemuck::cast_slice(&materials));
```

`#[repr(C)]` ensures the struct has C-compatible memory layout—the same layout the WGSL shader expects. Without it, Rust may reorder or pad fields differently than C would, causing data mismatches on the GPU.

---

## Performance Characteristics

One of the design principles running through all of Helio is O(1) CPU cost per frame. Let's be precise about what this means.

The CPU work per frame in the naive case: iterate every object, check if it's visible, build a draw call. This is O(N) in the number of objects—double the objects, double the CPU work. At 10,000 objects and a naive draw call cost of 1 microsecond each in driver overhead, that's 10ms per frame just in draw call submission before the GPU has done anything.

Helio's approach: all draw parameters are stored in a GPU buffer as an array of `DrawIndirectArgs` structs. The visibility determination (culling) runs as a compute shader that writes into this buffer. The actual rendering is triggered with one `multi_draw_indexed_indirect` command that reads the entire buffer and generates all draw calls internally on the GPU. The CPU work is one GPU command submission, regardless of scene size.

```
CPU cost per frame:
  Shadow matrix update (compute):    O(1)
  Shadow rendering:                  O(1) — one indirect draw per light face
  Occlusion cull (compute):          O(1) — one dispatch over all objects
  Depth prepass:                     O(1) — one indirect draw command
  G-buffer:                          O(1) — one indirect draw command
  Deferred lighting (fullscreen):    O(1) — one fullscreen draw
  TAA (fullscreen):                  O(1) — one fullscreen draw
```

The only place where CPU work scales is when the scene itself changes: new meshes, new lights, new materials. GrowableBuffer uploads only changed data, amortized over time. In a steady-state scene where nothing moves (or only the camera moves), the CPU work per frame is effectively constant regardless of scene complexity.

---

## Global Illumination: Radiance Cascades

The lighting model described so far handles direct illumination—light that travels from a light source, hits a surface once, and reaches the camera. But in reality, light bounces. When sunlight streams through a window onto a white floor, the ceiling above gets lit indirectly from that floor. When a neon sign glows green, the nearby wall picks up that green color. These indirect contributions are called **global illumination (GI)**, and capturing them in real time is one of the hardest problems in graphics.

Helio takes an approach called **Radiance Cascades**, which was described by Alexander Sannikov in 2024. The technique uses a hierarchical set of probe grids, where each cascade covers a progressively larger region of space at progressively coarser resolution.

The probe data is stored in a texture atlas. Each probe in the probe grid has a set of directional bins—small buckets that accumulate incoming radiance from different directions. When computing the lighting at a surface point, you find the nearest probe(s), look up their accumulated radiance in the direction of the surface normal, and use that as the ambient lighting contribution.

```rust
pub const PROBE_DIM:  u32 = 8;    // 8×8×8 probe grid
pub const DIR_DIM:    u32 = 4;    // 4×4 directional bins per probe
pub const ATLAS_W:    u32 = 32;   // atlas width in probe-tiles
pub const ATLAS_H:    u32 = 256;  // atlas height in probe-tiles
```

The radiance cascades pass requires hardware ray query support (`EXPERIMENTAL_RAY_QUERY`), which is not yet stable in wgpu 23. Until hardware ray tracing lands fully in the wgpu API, Helio falls back to a black (zero) GI atlas—effectively ambient = 0 from this path alone. In practice this means the current GI contribution comes from the deferred pass's sky ambient term and any baked lightmaps rather than the dynamic probe system.

```rust
pub struct RadianceCascadesPass {
    // ...
    /// When ray queries aren't supported, we write a 1×1 black atlas
    /// so all downstream passes have a valid texture to sample.
    fallback_atlas: Arc<wgpu::TextureView>,
}
```

The architecture is designed for forward compatibility: once hardware ray tracing is widely available via wgpu, the fallback path switches off automatically and the full cascade computation runs. Because the DeferredLightPass already samples the RC atlas in its shader, no downstream changes are needed when the GI path activates.

The deferred shader samples the atlas using world-space normal direction:

```wgsl
// Sample the nearest radiance probe for ambient GI
let probe_idx = world_to_probe_index(world_pos, probe_origin, probe_size);
let dir_uv    = direction_to_octahedral_uv(N);
let gi_sample = textureSample(rc_atlas, rc_sampler, dir_uv, probe_idx);
let gi_color  = gi_sample.rgb * material.albedo.rgb * (1.0 - material.metallic);
out_color += gi_color;
```

Even in fallback mode, the slot exists in every bind group. The zero atlas contributes nothing to lighting, so scenes look correct—just without indirect illumination until the hardware path activates.

---

## The Camera and Uniform Data

The camera is represented as a struct that's uploaded to the GPU as a uniform buffer every frame:

```rust
#[repr(C)]
#[derive(Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
pub struct GpuCameraUniforms {
    pub view:           [[f32; 4]; 4],
    pub proj:           [[f32; 4]; 4],
    pub view_proj:      [[f32; 4]; 4],
    pub inv_view:       [[f32; 4]; 4],
    pub inv_proj:       [[f32; 4]; 4],
    pub inv_view_proj:  [[f32; 4]; 4],
    pub position:       [f32; 3],
    pub near:           f32,
    pub forward:        [f32; 3],
    pub far:            f32,
    pub jitter:         [f32; 2],
    pub jitter_prev:    [f32; 2],
    pub frame_index:    u32,
    pub time:           f32,
    pub _pad:           [f32; 2],
}
```

Almost every pass binds this buffer at group 0, binding 0. The shader can then access `camera.view_proj` to transform world positions to clip space, `camera.inv_view_proj` to unproject screen-space positions back to world space (used by the deferred light pass and TAA), and `camera.jitter` / `camera.jitter_prev` for reprojection.

The TAA jitter is baked directly into the camera uniform so that geometry shaders automatically pick up the per-frame subpixel offset without any shader changes. The only shader that needs to handle jitter differently is the TAA resolve itself, which must undo the jitter when reading the history buffer.

The `frame_index` counter enables deterministic noise in shaders. Techniques like temporal blue noise (rotating a dithering pattern across frames) use this value to cycle through a noise texture stack, ensuring that any noise patterns don't persist fixedly at the same screen locations forever.

---

## How wgpu Submits GPU Work

It's worth understanding what actually happens when Helio calls `pass.execute(ctx)`. The wgpu API is designed around a **command encoder** pattern: you record a series of GPU commands into an encoder object, then submit the entire batch to the GPU at once.

```rust
// At the start of the frame, a CommandEncoder is created
let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
    label: Some("frame"),
});

// Passes record into the encoder via PassContext
for pass in &mut self.passes {
    pass.execute(&mut encoder, &ctx)?;
}

// At the end of the frame, the encoder is finished and submitted
let command_buffer = encoder.finish();
queue.submit([command_buffer]);
```

This batching model is fundamental to GPU performance. Submitting work to the GPU has a fixed overhead cost: the driver validates the command list, schedules it on the GPU timeline, and signals the CPU when to proceed. If you submitted one GPU command at a time and waited for each to complete, that overhead would dominate. By batching an entire frame's worth of commands into one submit, the overhead happens once.

The wgpu `RenderPass` and `ComputePass` objects wrap specific sections of the encoder where draw or dispatch commands are recorded. They're created with `encoder.begin_render_pass(...)` or `encoder.begin_compute_pass(...)`, and they must be dropped before the next pass can begin—which enforces a natural serialization order.

Within Helio's architecture, each `RenderPass` in the graph receives the encoder and records to it. The encoder object is threaded through as mutable state:

```rust
pub trait RenderPass: Send + Sync {
    fn prepare(&mut self, ctx: &PrepareCtx) -> HelioResult<()>;
    fn execute(&mut self, encoder: &mut wgpu::CommandEncoder, ctx: &ExecuteCtx) -> HelioResult<()>;
}
```

`prepare` runs synchronously on the CPU thread and may upload data to GPU buffers via `queue.write_buffer`. `execute` records GPU commands without blocking. The physical GPU work happens later, after `queue.submit`.

---

## WGSL: Writing Shaders for Helio

All of Helio's shaders are written in WGSL (WebGPU Shading Language), wgpu's native shader language. WGSL was designed at the same time as the WebGPU API and was built to fix some of the rough edges of GLSL and HLSL.

A typical fragment shader in WGSL for a G-buffer pass looks like this:

```wgsl
struct FragOut {
    @location(0) albedo:   vec4<f32>,   // albedo + alpha
    @location(1) normal:   vec4<f32>,   // world normal + F0.r
    @location(2) orm:      vec4<f32>,   // occlusion, roughness, metallic
    @location(3) emissive: vec4<f32>,   // emissive + F0.b
}

@fragment
fn fs_main(in: VertexOut) -> FragOut {
    let mat   = materials[in.material_idx];
    let tex   = textureSample(scene_textures[mat.albedo_tex], scene_samplers[0], in.uv);
    let color = tex.rgb * mat.albedo.rgb;

    let N_raw = textureSample(scene_textures[mat.normal_tex], scene_samplers[0], in.uv).xyz;
    let N     = normalize(mix(in.world_normal, decode_normal_map(N_raw, in.tbn), mat.normal_strength));

    let orm_tex = textureSample(scene_textures[mat.orm_tex], scene_samplers[0], in.uv);

    var out: FragOut;
    out.albedo   = vec4(color, tex.a);
    out.normal   = vec4(N * 0.5 + 0.5, mat.f0.r);       // encode to [0,1]
    out.orm      = vec4(orm_tex.rgb * vec3(1.0, mat.roughness, mat.metallic), 1.0);
    out.emissive = vec4(color * mat.emissive_intensity, mat.f0.b);
    return out;
}
```

The `@location(N)` attributes on `FragOut` correspond directly to the render target slots in the G-buffer. When wgpu creates the render pipeline, it maps these outputs to the attachments in the `RenderPassDescriptor`. The Rust code that creates the G-buffer render pipeline specifies exactly these four targets:

```rust
let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
    // ...
    fragment: Some(wgpu::FragmentState {
        targets: &[
            Some(wgpu::ColorTargetState { format: Rgba8Unorm,   /* albedo */   .. }),
            Some(wgpu::ColorTargetState { format: Rgba16Float,  /* normal */   .. }),
            Some(wgpu::ColorTargetState { format: Rgba8Unorm,   /* orm */      .. }),
            Some(wgpu::ColorTargetState { format: Rgba16Float,  /* emissive */ .. }),
        ],
        // ...
    }),
});
```

WGSL enforces explicit binding layouts—every resource a shader uses must be declared with `@group(N) @binding(M)` annotations that match the bind group layouts defined in Rust. This strictness eliminates an entire class of runtime binding bugs that plagued older graphics APIs.

---

## Running Examples

The fastest way to see Helio in action is through the examples crate, which contains several complete scenes:

```sh
cargo run -p examples --bin indoor_cathedral --release
cargo run -p examples --bin indoor_server_room --release
cargo run -p examples --bin ship_flight --release

# Load any FBX file directly
cargo run -p examples --bin load_fbx --release -- path/to/model.fbx
```

The `--release` flag is important for graphics benchmarking. Debug builds include bounds checking and other runtime safety overhead that can make GPU-bound code appear falsely slow. Always profile in release mode.

---

## Conclusion

A real-time renderer is one of the most demanding software systems you can build—it needs to be correct in its physics approximations, fast enough to run 60 times per second, stable across a huge range of hardware, extensible for new effects, and maintainable over years of development. Every architectural decision comes with trade-offs between these concerns.

Helio's approach concentrates complexity in the passes and the render graph while keeping the user-facing API minimal. The G-buffer decouples geometry from shading to enable many lights. The indirect draw system moves scene traversal to the GPU to keep CPU overhead O(1). The dirty tracking system ensures minimal data upload between frames. The handle-based scene API keeps user code clean and prevents lifetime bugs. Each of these choices reflects a specific lesson learned from building and shipping real-time graphics systems.

The pipeline described in this post covers the default graph. Helio also ships an HLFS (Hybrid Lit Forward Shading) graph for transparent objects, volumetric effects, SSAO, SDF-based distance fields for particle collision and audio occlusion, and more. The modular architecture means these can be composed in any order, swapped out, or replaced with custom implementations.

If graphics programming is something you've found intimidating, I hope this walk-through made it more legible. The concepts—depth buffers, G-buffers, shadow maps, temporal accumulation—have clear purposes once you understand what problem each one is solving. And if any of this sounds interesting to try, Helio's source is open.
