---
title: "Building Interactive UIs in GPUI: Actions, Context Menus, and Event Handling"
date: "2025-10-07"
categories: [Rust, GPUI, "UI Frameworks", "Coordinate Systems"]
tags: [GPUI, "Mouse Events", "Coordinate Conversion", "Rust UI", "Actions", "Context Menus"]
cover: "gpui-interactive.png"
---

When I first started working with GPUI (the UI framework powering Zed), I made every mistake in the book. I tried to handle actions in constructors, passed callbacks through closures that wouldn't compile, and spent hours debugging why my context menus would appear but never actually do anything. If you're reading this, you've probably been there too.

GPUI is different from React, Flutter, or even immediate-mode UIs like egui. It's a retained-mode framework with a sophisticated action dispatch system that feels more like SwiftUI's environment and focus system than traditional event bubbling. Once you understand how it works, it's incredibly powerful. But getting there? That's the journey we're taking today.

## The Action System: GPUI's Secret Sauce

Let me start with the most important concept that took me way too long to understand: **actions in GPUI are not callbacks**. They're first-class citizens that flow through the focus chain, similar to responder chains in AppKit or key event routing in browsers.

When you click a menu item that dispatches an action, GPUI doesn't call a function pointer. Instead, it:
1. Creates an action object
2. Looks at the current focus chain (which views have focus)
3. Walks up that chain asking "does anyone handle this action?"
4. Calls the handler on the first view that responds

This might seem overly complex, but it's what enables GPUI to build sophisticated interfaces where keyboard shortcuts, menu items, context menus, and toolbar buttons can all trigger the same action, and the currently focused view automatically handles it.

### Defining Actions: The Foundation

Let's start with how you actually define actions. GPUI provides two ways: the `actions!` macro for simple actions, and the `Action` derive macro for actions that need data.

```rust
use gpui::actions;
use serde::Deserialize;
use schemars::JsonSchema;

// Simple actions without data
actions!(
    file_explorer,
    [
        CutFile,
        CopyFile,
        PasteFile,
        DeleteFile,
        RenameFile,
    ]
);

// Actions with data need the full derive
#[derive(Action, Clone, PartialEq, Deserialize, JsonSchema)]
#[action(namespace = file_explorer)]
struct OpenFile {
    path: String,
}

#[derive(Action, Clone, PartialEq, Deserialize, JsonSchema)]
#[action(namespace = file_explorer)]
struct CreateFolder {
    parent_path: String,
}
```

The `namespace` is crucial—it prevents action name collisions when you have multiple components defining similar actions. The `JsonSchema` derive is required because GPUI needs to serialize actions for keybindings and other configuration.

**Common mistake #1**: Forgetting `JsonSchema`. You'll get a cryptic error about trait bounds not being satisfied. Always include it.

**Common mistake #2**: Using different namespaces for related actions. Keep actions that belong to the same component in the same namespace—it makes debugging much easier.

## Handling Actions: The Right Way

Here's where most developers (including past me) go wrong. You might think action handlers should be set up in the constructor, like this:

```rust
// ❌ WRONG - This doesn't compile in the right way
impl FileExplorer {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        // This won't work the way you think
        cx.on_action(Self::handle_cut);
        cx.on_action(Self::handle_copy);
        
        Self {
            focus_handle: cx.focus_handle(),
            // ... other fields
        }
    }
}
```

The problem is that `on_action` needs to be called on the element that's part of the view tree, not during construction. Here's the correct approach:

```rust
impl FileExplorer {
    pub fn new(_window: &mut Window, cx: &mut Context<Self>) -> Self {
        Self {
            focus_handle: cx.focus_handle(),
            selected_file: None,
            clipboard: None,
            // ... other state
        }
    }
    
    // Action handlers are just methods
    fn handle_cut(&mut self, _: &CutFile, window: &mut Window, cx: &mut Context<Self>) {
        if let Some(path) = self.selected_file.clone() {
            self.clipboard = Some((path, ClipboardOperation::Cut));
            println!("📋 Cut: {:?}", self.clipboard);
            cx.notify();
        }
    }
    
    fn handle_copy(&mut self, _: &CopyFile, window: &mut Window, cx: &mut Context<Self>) {
        if let Some(path) = self.selected_file.clone() {
            self.clipboard = Some((path, ClipboardOperation::Copy));
            println!("📋 Copy: {:?}", self.clipboard);
            cx.notify();
        }
    }
    
    fn handle_paste(&mut self, _: &PasteFile, window: &mut Window, cx: &mut Context<Self>) {
        if let Some((source, operation)) = &self.clipboard {
            // Perform the paste operation
            match operation {
                ClipboardOperation::Cut => {
                    // Move the file
                    self.move_file(source, &self.get_target_dir(), cx);
                }
                ClipboardOperation::Copy => {
                    // Copy the file
                    self.copy_file(source, &self.get_target_dir(), cx);
                }
            }
            cx.notify();
        }
    }
}

impl Render for FileExplorer {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let focus_handle = self.focus_handle.clone();
        
        div()
            .key_context("FileExplorer")  // Important: sets the context for actions
            .track_focus(&focus_handle)    // Important: enables this view to receive actions
            .on_action(cx.listener(Self::handle_cut))      // Register action handlers
            .on_action(cx.listener(Self::handle_copy))
            .on_action(cx.listener(Self::handle_paste))
            .size_full()
            .child(self.render_content(cx))
    }
}
```

The magic happens in three parts:

1. **`.key_context("FileExplorer")`** - This sets the action context name. It's used for keybinding scoping and debugging.

2. **`.track_focus(&focus_handle)`** - This tells GPUI that this element can receive focus, which is essential for the action dispatch system. Without this, actions won't reach your view.

3. **`.on_action(cx.listener(Self::handle_cut))`** - This registers the handler. The `cx.listener()` wrapper is crucial—it creates a properly scoped callback that maintains the correct lifetimes and lets GPUI call your method with `&mut self`.

**Common mistake #3**: Forgetting `track_focus`. Your view won't receive actions even if you register handlers.

**Common mistake #4**: Not calling `cx.notify()` after modifying state. The UI won't update unless you do.

## Context Menus: Where It All Comes Together

Context menus in GPUI are elegant once you understand the action system. They don't execute callbacks directly—they dispatch actions through the focus chain. This means your context menu can be defined far from the actual handler code.

Here's a real-world example from a file explorer with proper context menu integration:

```rust
use gpui_component::context_menu::ContextMenuExt;

fn render_file_item(&self, entry: &FileEntry, cx: &mut Context<Self>) -> impl IntoElement {
    let is_selected = self.selected_file.as_ref() == Some(&entry.path);
    let path = entry.path.clone();
    let is_directory = entry.is_directory;
    let has_clipboard = self.clipboard.is_some();
    
    // Create unique ID for the element (required for context menu)
    let item_id = SharedString::from(format!("file-{:x}", {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        let mut hasher = DefaultHasher::new();
        entry.path.hash(&mut hasher);
        hasher.finish()
    }));

    div()
        .id(item_id)  // Required for context menu to work
        .flex()
        .items_center()
        .gap_2()
        .h(px(28.0))
        .px_3()
        .cursor_pointer()
        .when(is_selected, |div| div.bg(cx.theme().accent))
        .hover(|div| div.bg(cx.theme().accent.opacity(0.1)))
        .child(Icon::new(get_file_icon(entry)))
        .child(entry.name.clone())
        // Left click to select/open
        .on_mouse_down(gpui::MouseButton::Left, {
            let path = path.clone();
            cx.listener(move |this, _, window, cx| {
                if is_directory {
                    this.toggle_folder(&path, window, cx);
                } else {
                    this.select_and_open_file(path.clone(), window, cx);
                }
            })
        })
        // Right click to select (important: ensures the context menu acts on the right file)
        .on_mouse_down(gpui::MouseButton::Right, {
            let path = path.clone();
            cx.listener(move |this, _, window, cx| {
                this.select_file(path.clone(), window, cx);
            })
        })
        // Context menu with conditional items
        .context_menu({
            let path = path.clone();
            let path_str = path.to_string_lossy().to_string();
            move |menu, _window, _cx| {
                let mut menu = menu;

                // Conditional items based on file type
                if is_directory {
                    menu = menu
                        .menu("New File Here", Box::new(CreateFile { 
                            parent_path: path_str.clone() 
                        }))
                        .menu("New Folder Here", Box::new(CreateFolder { 
                            parent_path: path_str.clone() 
                        }))
                        .separator();
                }

                // Common actions (work on the selected file)
                menu = menu
                    .menu("Cut", Box::new(CutFile))
                    .menu("Copy", Box::new(CopyFile));

                // Conditional paste (only show if clipboard has content)
                if has_clipboard {
                    menu = menu.menu("Paste", Box::new(PasteFile));
                }

                menu = menu
                    .separator()
                    .menu("Rename", Box::new(RenameFile))
                    .menu("Delete", Box::new(DeleteFile))
                    .separator()
                    .menu("Copy Path", Box::new(CopyFilePath))
                    .menu("Copy Relative Path", Box::new(CopyRelativePath))
                    .separator()
                    .menu("Reveal in File Manager", Box::new(RevealInFileManager));

                menu
            }
        })
}
```

Let's break down what makes this work:

### The ID Requirement

Context menus need the element to have an `.id()`. This is because GPUI uses the ID to track which element the menu is attached to. Without it, the menu won't display. I hash the path to create a stable, unique ID per file.

**Common mistake #5**: Using a string directly as an ID. Element IDs need to implement `Into<ElementId>`, which `SharedString` does but `String` doesn't.

### The Right-Click Selection Pattern

Notice the separate handler for right-clicks:

```rust
.on_mouse_down(gpui::MouseButton::Right, {
    let path = path.clone();
    cx.listener(move |this, _, window, cx| {
        this.select_file(path.clone(), window, cx);
    })
})
```

This is crucial. Without it, right-clicking an unselected file would show the context menu, but the actions would operate on whatever file was *previously* selected. By selecting on right-click, we ensure the context menu always acts on the file the user actually right-clicked.

### The Context Menu Builder

The closure passed to `.context_menu()` receives a `PopupMenu` builder and must return it. The API is fluent:

```rust
menu
    .menu("Label", Box::new(ActionInstance))
    .separator()
    .menu("Another Label", Box::new(AnotherAction))
```

Actions are passed as `Box<dyn Action>`. For actions without data, just box them directly: `Box::new(CutFile)`. For actions with data, construct them: `Box::new(OpenFile { path: "...".into() })`.

**Common mistake #6**: Trying to use closures in the menu. The menu wants actions, not callbacks. This is by design—it keeps the action dispatch system consistent.

### Conditional Menu Items

One of the most powerful patterns is building menus conditionally:

```rust
let mut menu = menu;

if is_directory {
    menu = menu.menu("New File Here", Box::new(CreateFile { ... }));
}

if has_clipboard {
    menu = menu.menu("Paste", Box::new(PasteFile));
}

menu  // Return the built menu
```

The menu builder is moved and reassigned. This lets you conditionally include items based on runtime state.

## The Focus Chain: Making It All Work

Understanding the focus chain is key to debugging why actions aren't working. Here's the mental model:

```
Window
  └─ Root View (has focus)
      └─ Sidebar
          └─ FileExplorer (tracks focus, has key_context)
              └─ File Items (don't need focus themselves)
```

When an action is dispatched (from a context menu, keyboard shortcut, or menu bar), GPUI:

1. Starts at the currently focused element
2. Checks if it has a handler for this action
3. If not, walks up to the parent
4. Repeats until it finds a handler or reaches the root

This means:
- Your `FileExplorer` needs `.track_focus(&focus_handle)` to be in the chain
- You can have multiple views with handlers for the same action—the focused one wins
- Child elements inherit the context of their parents

**Common mistake #7**: Having multiple views that handle the same action without proper focus management. You'll get the wrong handler called.

## Real-World Example: Complete File Explorer

Let me show you a complete, working example that ties everything together. This is simplified but based on production code:

```rust
use gpui::*;
use gpui_component::{
    context_menu::ContextMenuExt,
    ActiveTheme as _,
    Icon, IconName,
};
use serde::Deserialize;
use schemars::JsonSchema;
use std::path::PathBuf;

// Define our actions
actions!(file_explorer, [CutFile, CopyFile, PasteFile, DeleteFile, RenameFile]);

#[derive(Action, Clone, PartialEq, Deserialize, JsonSchema)]
#[action(namespace = file_explorer)]
struct CreateFile {
    parent_path: String,
}

#[derive(Clone, Debug)]
enum ClipboardOperation {
    Cut,
    Copy,
}

pub struct FileExplorer {
    focus_handle: FocusHandle,
    files: Vec<PathBuf>,
    selected_file: Option<PathBuf>,
    clipboard: Option<(PathBuf, ClipboardOperation)>,
}

impl FileExplorer {
    pub fn new(_window: &mut Window, cx: &mut Context<Self>) -> Self {
        Self {
            focus_handle: cx.focus_handle(),
            files: vec![
                PathBuf::from("src/main.rs"),
                PathBuf::from("src/lib.rs"),
                PathBuf::from("Cargo.toml"),
            ],
            selected_file: None,
            clipboard: None,
        }
    }

    fn select_file(&mut self, path: PathBuf, cx: &mut Context<Self>) {
        self.selected_file = Some(path);
        cx.notify();
    }

    fn handle_cut(&mut self, _: &CutFile, _: &mut Window, cx: &mut Context<Self>) {
        if let Some(path) = self.selected_file.clone() {
            self.clipboard = Some((path.clone(), ClipboardOperation::Cut));
            println!("✂️  Cut: {:?}", path);
            cx.notify();
        }
    }

    fn handle_copy(&mut self, _: &CopyFile, _: &mut Window, cx: &mut Context<Self>) {
        if let Some(path) = self.selected_file.clone() {
            self.clipboard = Some((path.clone(), ClipboardOperation::Copy));
            println!("📋 Copy: {:?}", path);
            cx.notify();
        }
    }

    fn handle_paste(&mut self, _: &PasteFile, _: &mut Window, cx: &mut Context<Self>) {
        if let Some((source, operation)) = &self.clipboard {
            println!("📌 Paste {:?}: {:?}", operation, source);
            // In real code: actually move/copy the file
            cx.notify();
        }
    }

    fn handle_delete(&mut self, _: &DeleteFile, _: &mut Window, cx: &mut Context<Self>) {
        if let Some(path) = &self.selected_file {
            println!("🗑️  Delete: {:?}", path);
            // In real code: actually delete the file
            self.files.retain(|p| p != path);
            self.selected_file = None;
            cx.notify();
        }
    }

    fn handle_rename(&mut self, _: &RenameFile, _: &mut Window, cx: &mut Context<Self>) {
        if let Some(path) = &self.selected_file {
            println!("✏️  Rename: {:?}", path);
            // In real code: show rename dialog
            cx.notify();
        }
    }

    fn handle_create_file(&mut self, action: &CreateFile, _: &mut Window, cx: &mut Context<Self>) {
        let parent = PathBuf::from(&action.parent_path);
        let new_file = parent.join("new_file.rs");
        println!("➕ Create file in: {:?}", parent);
        // In real code: create the file
        self.files.push(new_file);
        cx.notify();
    }

    fn render_file_item(&self, path: &PathBuf, cx: &mut Context<Self>) -> impl IntoElement {
        let is_selected = self.selected_file.as_ref() == Some(path);
        let path = path.clone();
        let has_clipboard = self.clipboard.is_some();
        let is_directory = path.extension().is_none();
        
        let item_id = SharedString::from(format!("file-{}", path.display()));

        div()
            .id(item_id)
            .flex()
            .items_center()
            .gap_2()
            .px_3()
            .py_2()
            .cursor_pointer()
            .when(is_selected, |this| this.bg(cx.theme().accent))
            .hover(|this| this.bg(cx.theme().accent.opacity(0.1)))
            .child(Icon::new(IconName::Page).size_4())
            .child(
                div()
                    .text_sm()
                    .child(path.file_name().unwrap().to_string_lossy().to_string())
            )
            .on_mouse_down(gpui::MouseButton::Left, {
                let path = path.clone();
                cx.listener(move |this, _, _, cx| {
                    this.select_file(path.clone(), cx);
                })
            })
            .on_mouse_down(gpui::MouseButton::Right, {
                let path = path.clone();
                cx.listener(move |this, _, _, cx| {
                    this.select_file(path.clone(), cx);
                })
            })
            .context_menu({
                let path_str = path.to_string_lossy().to_string();
                move |menu, _, _| {
                    let mut menu = menu;

                    if is_directory {
                        menu = menu
                            .menu("New File Here", Box::new(CreateFile {
                                parent_path: path_str.clone(),
                            }))
                            .separator();
                    }

                    menu = menu
                        .menu("Cut", Box::new(CutFile))
                        .menu("Copy", Box::new(CopyFile));

                    if has_clipboard {
                        menu = menu.menu("Paste", Box::new(PasteFile));
                    }

                    menu.separator()
                        .menu("Rename", Box::new(RenameFile))
                        .menu("Delete", Box::new(DeleteFile))
                }
            })
    }
}

impl Focusable for FileExplorer {
    fn focus_handle(&self, _: &App) -> FocusHandle {
        self.focus_handle.clone()
    }
}

impl Render for FileExplorer {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let focus_handle = self.focus_handle.clone();

        div()
            .key_context("FileExplorer")
            .track_focus(&focus_handle)
            .on_action(cx.listener(Self::handle_cut))
            .on_action(cx.listener(Self::handle_copy))
            .on_action(cx.listener(Self::handle_paste))
            .on_action(cx.listener(Self::handle_delete))
            .on_action(cx.listener(Self::handle_rename))
            .on_action(cx.listener(Self::handle_create_file))
            .size_full()
            .flex()
            .flex_col()
            .gap_1()
            .p_4()
            .child(
                div()
                    .text_sm()
                    .font_semibold()
                    .mb_2()
                    .child("File Explorer")
            )
            .children(
                self.files
                    .iter()
                    .map(|path| self.render_file_item(path, cx))
            )
    }
}
```

This example demonstrates:
- Proper action definition and registration
- Focus handling with `track_focus` and `key_context`
- Context menu with conditional items
- Right-click selection pattern
- State management with `cx.notify()`
- Complete action handlers that modify state

## Advanced Patterns

### Keyboard Shortcuts

Once you have actions working, adding keyboard shortcuts is trivial. In your app initialization:

```rust
cx.bind_keys([
    #[cfg(target_os = "macos")]
    KeyBinding::new("cmd-x", CutFile, Some("FileExplorer")),
    #[cfg(not(target_os = "macos"))]
    KeyBinding::new("ctrl-x", CutFile, Some("FileExplorer")),
    
    KeyBinding::new("delete", DeleteFile, Some("FileExplorer")),
    KeyBinding::new("f2", RenameFile, Some("FileExplorer")),
]);
```

The `Some("FileExplorer")` context means these shortcuts only work when the FileExplorer has focus. This is why the `key_context` name matters—it connects keybindings to views.

### Shared Actions Across Views

Multiple views can handle the same action:

```rust
// In FileExplorer
.on_action(cx.listener(Self::handle_delete))

// In CodeEditor  
.on_action(cx.listener(Self::handle_delete))

// In ImageViewer
.on_action(cx.listener(Self::handle_delete))
```

GPUI automatically dispatches to whichever view has focus. Press Delete in the file explorer? Files get deleted. Press Delete in the code editor? Selected text gets deleted. Same action, different handlers, no conditionals needed.

### Clipboard Integration

GPUI provides clipboard access through the context:

```rust
fn handle_copy_path(&mut self, _: &CopyFilePath, _: &mut Window, cx: &mut Context<Self>) {
    if let Some(path) = &self.selected_file {
        let path_str = path.to_string_lossy().to_string();
        cx.write_to_clipboard(ClipboardItem::new_string(path_str));
        println!("📋 Copied path to clipboard");
    }
}
```

This integrates with the system clipboard, so users can paste paths into other applications.

## Common Pitfalls and How to Avoid Them

### 1. The Closure Lifetime Dance

You'll often need to clone values before moving them into closures:

```rust
// ❌ Won't compile - can't move path twice
.on_mouse_down(gpui::MouseButton::Left, cx.listener(move |this, _, _, cx| {
    this.select_file(path, cx);  // path moved here
}))
.context_menu(move |menu, _, _| {
    // Can't use path here - already moved!
})

// ✅ Clone before each closure
.on_mouse_down(gpui::MouseButton::Left, {
    let path = path.clone();
    cx.listener(move |this, _, _, cx| {
        this.select_file(path, cx);
    })
})
.context_menu({
    let path = path.clone();
    move |menu, _, _| {
        // Now we have our own copy
    }
})
```

### 2. Forgetting to Notify

State changes don't trigger re-renders automatically:

```rust
fn handle_delete(&mut self, _: &DeleteFile, _: &mut Window, cx: &mut Context<Self>) {
    self.files.remove(self.selected_index);
    // ❌ UI won't update!
}

fn handle_delete(&mut self, _: &DeleteFile, _: &mut Window, cx: &mut Context<Self>) {
    self.files.remove(self.selected_index);
    cx.notify();  // ✅ Now it will
}
```

### 3. Element ID Collisions

If you render multiple items with the same ID, only the first will work:

```rust
// ❌ All files get the same ID
self.files.iter().map(|file| {
    div()
        .id("file-item")  // Collision!
        .context_menu(...)
})

// ✅ Unique ID per file
self.files.iter().map(|file| {
    div()
        .id(format!("file-{}", file.display()))
        .context_menu(...)
})
```

### 4. Missing Focus Handle

Without a focus handle, your view is invisible to the action system:

```rust
// ❌ Actions won't work
div()
    .on_action(cx.listener(Self::handle_cut))
    .child(...)

// ✅ Focus handle makes it visible
div()
    .track_focus(&self.focus_handle)
    .on_action(cx.listener(Self::handle_cut))
    .child(...)
```

## Performance Considerations

GPUI is designed for high-performance UIs, but you can still shoot yourself in the foot. Some tips:

**Avoid recreating closures unnecessarily**: Extract them into local variables when rendering many items:

```rust
// ❌ Creates new closure for each file
self.files.iter().map(|file| {
    div().on_mouse_down(MouseButton::Left, cx.listener(|this, _, _, cx| {
        // ...
    }))
})

// ✅ Still creates closures, but at least we're conscious of it
self.files.iter().map(|file| {
    let path = file.clone();
    let handler = cx.listener(move |this, _, _, cx| {
        this.select_file(path.clone(), cx);
    });
    div().on_mouse_down(MouseButton::Left, handler)
})
```

**Use `cx.notify()` judiciously**: Only call it when state actually changes that affects rendering.

**Implement `Focusable` correctly**: The focus handle is checked frequently. Keep it as a simple clone:

```rust
impl Focusable for MyView {
    fn focus_handle(&self, _: &App) -> FocusHandle {
        self.focus_handle.clone()  // Just clone it, don't compute anything
    }
}
```

## Debugging Actions

When actions don't work, here's my debugging checklist:

1. **Is the action defined correctly?** Check that `JsonSchema` is derived and the namespace matches.

2. **Is the view registered?** Check that `.on_action(cx.listener(...))` is called in `render()`.

3. **Does the view have focus?** Add `.track_focus(&focus_handle)` and a `key_context`.

4. **Is the action being dispatched?** Add a `println!` at the start of your handler.

5. **Is the state correct?** Check that the selected file/item is what you expect.

6. **Are you cloning correctly?** Verify that closures have the right data.

GPUI also has excellent logging. Enable it with:

```bash
RUST_LOG=gpui=debug cargo run
```

This will show you action dispatch, focus changes, and more.

## Wrapping Up

GPUI's action system feels alien at first if you're coming from callback-based frameworks. But once it clicks, you'll appreciate how it enables:
- Consistent handling across menus, keyboard shortcuts, and toolbar buttons
- Proper focus management without manual wiring
- Clean separation between UI structure and behavior
- Testable action handlers that don't depend on UI state

The key insights are:
- Actions flow through the focus chain, not through callbacks
- Register handlers in `render()` with `.on_action(cx.listener(...))`
- Use `.track_focus()` and `.key_context()` to participate in the chain
- Context menus dispatch actions; they don't call callbacks
- Clone values before moving into closures, and remember to `cx.notify()`

GPUI is powerful, but it requires understanding its model. I hope this guide saves you the hours of confusion I went through. Now go build something awesome—and when your context menus mysteriously don't work, you'll know exactly where to look.