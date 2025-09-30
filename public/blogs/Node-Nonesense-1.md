---
title: "Type Safety and Documentation in Rust Node Graph Systems" 
date: "2025-09-30"
categories: ["Engineering", "Rust", "Architecture"]
tags: ["Rust", "Node Graph", "TypeId", "Documentation", "Type Safety"]
---

# Type Safety and Documentation in Rust Node Graph Systems

Node graph systems are a popular way to visually represent logic, workflows, or data flows. Each node in the graph exposes input and output pins, and users connect these pins to build complex behaviors. In Rust, building a robust node system means leveraging the language’s strong type system and documentation features. In this post, we’ll explore how to achieve type-safe connections using `TypeId`, and how to keep your nodes well-documented using attributes.

---

## Why Type Safety Matters

In a node graph, each pin has a type. When connecting pins, you want to ensure that only compatible types can be connected. In many dynamic languages, this is handled by storing type names as strings and comparing them at runtime. However, this approach is fragile: typos, naming collisions, and lack of compile-time checks can lead to subtle bugs.

Rust’s static typing offers a better way. While Rust doesn’t have runtime type objects like some other languages, it does provide a unique identifier for each type at runtime: `std::any::TypeId`.

---

## Using `TypeId` for Pin Validation

`TypeId` is a unique, compiler-generated identifier for a type. You can obtain it for any `'static` type using `TypeId::of::<T>()`. While you can’t reconstruct the type from a `TypeId`, you can compare them for equality—perfect for validating node connections.

Here’s how you might define a pin in your node system:

```rust
use std::any::{TypeId, type_name};

pub struct PinDefinition {
    pub name: String,
    pub type_name: String, // For UI and docs
    pub type_id: TypeId,   // For runtime validation
    // ... other fields
}
```

When defining a node, you set both the human-readable name and the `TypeId`:

```rust
PinDefinition {
    name: "thing".to_string(),
    type_name: type_name::<bool>().to_string(),
    type_id: TypeId::of::<bool>(),
    // ...
}
```

### Validating Connections

When a user tries to connect two pins, you simply compare their `TypeId`s:

```rust
fn can_connect(output: &PinDefinition, input: &PinDefinition) -> bool {
    output.type_id == input.type_id
}
```

This ensures that only pins of the exact same type can be connected, eliminating the risk of runtime type errors due to typos or naming collisions.

---

## Example: Defining a Node with Documentation

Let’s look at a real-world example of defining a node with documentation and type-safe pins:

```rust
#[bp_doc("# This is a title")]
#[bp_doc("This is some docs")]

#[blueprint(type: NodeTypes::control_flow, docs_path: "./docs/thing.md")]
fn branch(thing: bool) {
    if thing {
       exec_output!("True");
    } else {
       exec_output!("False");
   }
}
```

In this example, the `branch` node takes a `bool` input and emits an execution output based on the value. The `#[bp_doc]` attributes provide rich, Markdown-formatted documentation directly alongside the code.

---

> **Aside: The Power of Documentation Attributes**
>
> The use of `#[bp_doc(...)]` attributes allows you to embed documentation right where it matters—next to your node’s implementation. This ensures that documentation stays up-to-date and can be extracted automatically for use in editors, generated docs, or tooltips. Keeping docs close to code reduces the risk of them becoming stale or inconsistent, benefiting both users and maintainers.

---

## Why Store Both Type Name and TypeId?

While `TypeId` is perfect for validation, it’s not human-readable. Storing the type name alongside the `TypeId` is useful for:

- Displaying type information in the UI
- Generating documentation
- Debugging

But for connection validation, only the `TypeId` matters.

---

## In Summary

By leveraging Rust’s `TypeId`, you can build a node graph system that is both type-safe and user-friendly. Store the human-readable type name for display, but rely on `TypeId` for connection validation. Combine this with embedded documentation attributes, and you have a system that is robust, maintainable, and a pleasure to use.

**Happy coding!**