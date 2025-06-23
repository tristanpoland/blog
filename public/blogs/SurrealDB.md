---
title: "The SurrealDB Reality Check; Marketing vs Reality"
date: "2025-6-23"
categories: ["Database", "Performance", "Marketing"] 
tags: ["Architecture"]
---

## The SurrealDB Reality Check: When Marketing Meets Performance

When SurrealDB burst onto the scene with promises of "one database, infinite memory" and the ability to "scale from edge devices to petabyte clusters," it caught the attention of developers everywhere. The marketing was bold, the architecture innovative, and the promises ambitious. But after diving deep into user experiences, official benchmarks, and three years of community feedback, there's a story here that goes beyond the glossy marketing materials.

## The marketing machine was ahead of the engine

Let's start with what SurrealDB has been telling us. Their homepage doesn't shy away from big claims: ["The ultimate multi-model database"](https://surrealdb.com) that delivers "far better performance" than alternatives while processing "thousands of queries per second." The company positioned itself as offering "highly-performant" operations across document, graph, and relational models – essentially promising to be everything to everyone.

Here's where it gets interesting: these claims have been remarkably consistent since 2022, but the supporting evidence didn't appear until February 2025. For nearly three years, the community repeatedly asked for performance benchmarks, and the company consistently deferred. When founder Tobie Morgan Hitchcock acknowledged in [GitHub discussions](https://github.com/orgs/surrealdb/discussions/43) that "performance should be far better than it is now," the marketing materials continued promoting high-performance capabilities.

During 2023-2024, team members were telling the community that "V1 isn't really meant to be 'production-ready', but just stable" – yet the marketing simultaneously promoted production use. This disconnect between internal acknowledgments and external messaging created unrealistic expectations that would later clash with reality.

## What users actually experienced

The rubber meets the road in GitHub issues, Reddit threads, and community forums where real developers shared their experiences. The pattern that emerges is concerning and consistent: [memory usage problems](https://github.com/surrealdb/surrealdb/issues/2750), query performance issues, and scaling limitations that made production deployment problematic.

Take memory consumption – users reported SurrealDB consuming over 14GB of memory when inserting just 4 million small documents (200-300 bytes each). Worse, that memory wasn't released after operations completed. One user noted that running a simple count query caused memory usage to spike from 1GB back to 14GB. These weren't isolated incidents; similar issues appeared across different storage backends and configurations.

The query performance gap is even more stark. Direct comparisons showed **SurrealDB performing 40 times slower than MySQL** for queries returning 1,000 records from a 40,000-row table – 280ms versus 7ms. What's particularly troubling is that adding indexes actually made things worse in some cases, with query times increasing from 280ms to 400ms after index creation. That's the opposite of what should happen.

One community member's assessment was particularly blunt: SurrealDB only shows "competitive performance" for "exceptionally simple 'point' queries" while "relational is a disaster, and traversing a graph seems to be very slow as well." These aren't the experiences you'd expect from a database marketing itself as high-performance across all operations.

## The benchmarks finally arrived (and confirmed concerns)

When SurrealDB [finally released comprehensive benchmarks in February 2025](https://surrealdb.com/blog/beginning-our-benchmarking-journey), the results validated many community concerns. The numbers were mixed at best and revealed significant performance gaps that contradict marketing claims.

**Scan operations with offset and limit were particularly painful** – SurrealDB took 779ms compared to PostgreSQL's 25ms for equivalent operations. That's a 31-fold performance disadvantage. Similar patterns emerged across multiple scan scenarios, with SurrealDB consistently slower by factors of 15-30x. The company acknowledged these operations are "not fully optimised yet," which is quite an understatement for operations that many applications rely on heavily.

Read performance showed more competitive results for simple document retrieval, but write performance remained merely competitive, not superior. PostgreSQL outperformed SurrealDB in create operations (205k vs 155k operations per second). Even more concerning were the performance variations between storage backends – the native SurrealKV storage engine achieved only 20,000-71,000 operations per second compared to RocksDB's competitive performance.

## The architectural reality behind the performance

Digging into the technical details reveals why SurrealDB struggles with performance. **The database lacks the sophisticated query planner found in mature SQL databases**, requiring manual optimization for complex queries. As of early 2025, the system still doesn't use indexes for UPDATE or DELETE operations on large tables – that's a basic functionality gap in any serious database.

The multi-model architecture, while offering flexibility, introduces performance overhead that specialized databases avoid. Building on top of key-value stores (RocksDB/TiKV) with a compute layer separation creates additional latency for complex operations. Users reported that seemingly equivalent graph traversal queries could vary in performance by factors of 4x simply due to syntax differences – indicating poor query plan optimization.

Even schema handling affects performance unpredictably. Users found that schemaless tables performed "excellently" while schemafull tables were "much slower," suggesting optimization issues in the schema validation layer. This kind of performance inconsistency makes capacity planning nearly impossible for production deployments.

## The development team's response and timeline

SurrealDB's development team initially prioritized feature development over performance optimization, leading to a problematic timeline. They consistently deferred benchmark requests from 2022 through 2024, with multiple missed deadlines. A promised November 2023 benchmark release was delayed until February 2025 – that's a 15-month delay on something the community desperately wanted.

The company's communication around performance evolved significantly. Early responses avoided direct performance discussions, with the team even temporarily removing "performance" from their FAQ page. Later communications acknowledged that version 1.x was intended to be "stable" rather than "production-ready," contradicting marketing materials promoting production adoption.

SurrealDB 2.0, released in September 2024, represented a significant investment in performance improvements with a rebuilt parser, enhanced memory management, and optimized algorithms. However, fundamental architectural limitations remain unresolved. The February 2025 benchmark release marked a turning point in transparency, with the team stating that "2025 marks a major shift" with focus changing "from new to better."

## Where SurrealDB stands today

As of early 2025, SurrealDB occupies an interesting position in the database landscape. **It excels at document-style operations and simple key-value retrieval** but struggles with complex relational queries, large result sets, and analytical workloads that many applications require. The database shows genuine promise for applications with predictable access patterns that primarily use point queries and simple document operations.

However, production deployment still requires careful consideration. Memory management issues need monitoring and potential restart procedures. Query performance optimization requires manual tuning and architectural awareness. The lack of sophisticated query planning means that minor syntax changes can dramatically affect performance, requiring specialized expertise for optimal operation.

The recent shift toward performance optimization and transparency provides hope, but the evidence suggests that organizations evaluating SurrealDB need to conduct careful performance testing before production deployment. The innovative multi-model capabilities come with performance trade-offs that may not align with marketing expectations, particularly for applications requiring complex queries or traditional relational patterns at scale.

The gap between SurrealDB's marketing promises and delivered performance reflects prioritization decisions that emphasized features over optimization during critical development phases. While progress is being made, current limitations require realistic assessment against specific application requirements rather than reliance on marketing claims about universal high performance.