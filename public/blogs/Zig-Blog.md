---
title: "Why I'm Stepping Away from Zig and Its Foundation"
date: "2026-1-2"
categories: [Rust, Zig, Codeberg]
tags: ["Nerd Drama"]
cover: "Zig-Blog.png"
---

I've decided to step back from the Zig programming language and its community. This isn't a knee-jerk reaction to one incident, but rather the result of observing several concerning patterns over the past year—patterns that suggest this project isn't aligned with what I need from a systems programming language.

The recent GitHub Actions controversy was the catalyst, but the underlying issues run deeper: frequent breaking changes, leadership conduct that raises eyebrows, and technical decisions that prioritize ideology over practical engineering concerns.

## The Safe Sleep Bug: What Actually Happened

Let's start with the facts, because the narrative around this got pretty warped.

In February 2022, GitHub Actions replaced the standard POSIX `sleep` command with a bash script called `safe_sleep.sh`. The script had a bug: if the process didn't get scheduled at the right moment, it would loop forever consuming 100% CPU. 

This is a legitimate bug. I'm not defending GitHub here—it shouldn't have happened, and it caused real problems for Zig's CI infrastructure. Matthew Lugg, a Zig core developer, noted that multiple processes ran for hundreds of hours, taking down runner services for weeks.

However, the bug was fixed on August 20, 2025, about four months after being reported. The issue thread stayed open until December 1st, which was poor communication from GitHub, but the actual technical problem was resolved well before the controversy peaked.

What concerns me is that this bug appears to have been used as justification for a decision that was likely already made. The reaction seemed disproportionate to the actual technical severity, especially given that the fix was implemented months before the dramatic exit announcement.

## The Leadership Issue

The way Andrew Kelley, president and lead developer of the Zig Software Foundation, handled the GitHub departure troubled me significantly.

In his initial announcement, he referred to GitHub and Microsoft engineers using terms like "monkeys" and "losers." These comments were later edited (with "losers" changed to "rookies" in some instances), and he eventually posted an apology. But for someone representing an entire programming language foundation, the initial choice of words was remarkably unprofessional.

This isn't an isolated pattern. In 2022, he wrote that "go is great if you are an amateur with no taste, like 99% of google employees." In his 2020 "Open Letter to Everyone I've Butted Heads With," he acknowledged "doing issue triaging while grumpy" and blocking accounts unfairly, promising to do better. The 2025 incident suggests those patterns haven't changed.

When you're leading a project that aims for mainstream adoption, this kind of public rhetoric has consequences. It sets the tone for the entire community and affects how the project is perceived by potential users, contributors, and sponsors.

## The Underlying Motivation: AI Opposition

The bug was the stated reason, but the deeper motivation for leaving GitHub appears to be opposition to Microsoft's AI initiatives, particularly GitHub Copilot. The Zig Software Foundation maintains a strict no-AI policy, and GitHub's embrace of AI tools was seen as incompatible with their values.

I understand having principled positions on AI. However, the practical implications are significant. GitHub Sponsors was the Foundation's single largest revenue source in 2024—over $170,000. Kelley acknowledged this while simultaneously calling it a "liability" and encouraging donors to move to alternative platforms.

This strikes me as prioritizing ideological purity over practical sustainability. GitHub's reach, infrastructure, and integrated tooling provide real value that's hard to replicate elsewhere.

## The Move to Codeberg: Trading Stability for Principles

Codeberg is a non-profit Git hosting service with admirable values—open source, community-driven, and free from corporate control. I respect what they're trying to accomplish.

However, their infrastructure has some documented limitations. In their own 2025 blog posts, Codeberg's team acknowledged that their setup "is not very reliable yet." They've experienced issues with their CI/CD system, including workflows failing when titles contain spaces. They're attempting to reduce SSD wear by keeping container writes in memory but haven't solved the problem of persisting container images properly.

They don't yet have distributed search infrastructure or high-availability clustering. According to their documentation, "Forgejo is not ready to support high availability or clustering out of the box."

For a major programming language moving its primary infrastructure, these are non-trivial concerns. GitHub has its problems, but it's battle-tested infrastructure serving millions of repositories.

## The Stability Question

Beyond the recent drama, there's a more fundamental issue: Zig's stability. The language is currently at version 0.15, and each release brings significant breaking changes.

Version 0.15 introduced what the community dubbed "Writergate"—a complete overhaul of the I/O system. ArrayList was renamed to array_list.Managed with different semantics. The changes were extensive enough that Kelley himself described them as "extremely breaking."

This isn't unusual for Zig. Each version has brought substantial changes that require code rewrites. The Ghostty terminal emulator project, for instance, explicitly chose to remain on 0.14.1 rather than upgrade to 0.15 for their release, citing the extent of the breaking changes.

The standard library is explicitly described as "unstable and mainly serves as a testbed for the language." This makes sense for a pre-1.0 language, but it does create challenges for anyone trying to build production systems or maintain libraries.

By contrast, Rust reached 1.0 in 2015 and has maintained strict backwards compatibility since then. Code written years ago still compiles with modern Rust compilers. For developers who value stability, this difference matters considerably.

## Why Rust Works Better for My Needs

I'm not here to evangelize Rust, but when I evaluate what I need from a systems programming language, Rust consistently delivers what Zig doesn't yet provide.

**Memory safety:** Rust's borrow checker catches entire classes of bugs at compile time. Zig provides some runtime checks and good allocator debugging tools, but the fundamental approach is manual memory management. After 50 years of memory safety issues in C and C++, I prefer a language that prevents these bugs structurally rather than detecting them after the fact.

**Stability:** Rust has maintained backwards compatibility since its 1.0 release in 2015. I can upgrade my Rust compiler without rewriting code. With Zig's current pre-1.0 status, breaking changes are frequent and expected.

**Ecosystem maturity:** Rust has over 100,000 crates, comprehensive documentation, and mature tooling (Cargo, Clippy, rust-analyzer). Zig's ecosystem is smaller and evolving, with documentation that becomes outdated as the language changes.

**Professional governance:** The Rust project maintains professional communications and focuses on technical excellence. Recent events suggest the Zig Foundation prioritizes other concerns.

Zig's main advantage is simplicity—no borrow checker to learn, more straightforward syntax. This is valuable, and for developers coming from C who want similar manual control, Zig might be the right choice. But that simplicity means you're responsible for memory management complexity yourself, which is exactly what the borrow checker helps automate.

## My Decision

This decision isn't based on a single incident, but on several factors that don't align with what I need:

**Leadership concerns:** The public communications from the Foundation's leadership have shown a pattern of unprofessional rhetoric that concerns me. How a project's leaders conduct themselves matters, especially for a language seeking mainstream adoption.

**Frequent breaking changes:** The ongoing instability makes it difficult to build and maintain projects. Every version upgrade requires significant refactoring work.

**Memory safety approach:** I prefer Rust's compile-time guarantees over Zig's runtime detection and manual management approach. This is a personal choice based on my priorities around security and reliability.

**Platform decisions:** Moving to less mature infrastructure for ideological reasons while abandoning major revenue sources suggests priorities that don't match my pragmatic engineering approach.

**Community culture:** There's a certain combativeness in parts of the Zig community—an "us versus Big Tech" mentality that I find counterproductive. Healthy open source projects can critique platforms without making everything adversarial.

## What I'm Doing Instead

I'll continue using Rust for systems programming work. It has the stability, safety guarantees, and mature ecosystem I need. The learning curve is real, but the long-term benefits justify the initial investment.

This isn't an attempt to convince anyone else to abandon Zig. If you're using it successfully and the breaking changes don't bother you, that's perfectly valid. Different projects have different needs, and different developers have different priorities.

For me, though, the combination of instability, leadership concerns, and weaker memory safety compared to alternatives makes Zig not the right choice. I'm sharing this perspective in case others have similar concerns and want to know they're not alone in them.

Maybe Zig will reach 1.0 and stabilize. Maybe the governance will mature. But I'm not investing more time waiting to find out, and I certainly wont be supporting a project with an activly toxic leadership. That is not what open source stands for.