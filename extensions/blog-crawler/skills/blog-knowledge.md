---
skill: blog-knowledge
domain: data-engineering
description: Understands crawled Anthropic customer case studies and extracts structured facts
---

# Blog Knowledge Retrieval

You have access to cached customer blog posts from claude.com/customers/*. These are first-party Anthropic case studies describing how companies use Claude.

## What you know

- **188 customer case studies** covering industries from fintech to healthcare to developer tools
- Each post contains: company name, use case, integration pattern, results/metrics, Claude features used
- Posts are tagged by industry, product (Bedrock, Vertex AI, Agent SDK, Claude Code), and use case

## How to use this knowledge

1. Use the `search-blogs` WebMCP tool to find relevant case studies
2. Extract structured facts: company, industry, problem, solution, metrics, Claude features
3. Cross-reference customer patterns to identify common integration architectures
4. Use customer examples as test scenarios for simulation frameworks

## Data freshness

Blog posts are crawled weekly (Sunday 6am UTC) and cached in Neon Postgres with SHA-256 content hashing. Only changed content is re-cached.
