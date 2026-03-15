---
command: blog-search
description: Search cached customer blog posts by company, tag, or keyword
usage: /blog-search [query]
---

# Blog Search

Search the cached customer blog posts for relevant case studies.

## Filters

- **company**: Partial match on company name (e.g. "stripe", "figma")
- **tag**: Exact match on classification tag (e.g. "developer-tools", "healthcare", "bedrock")
- **keyword**: Full-text search across cached blog content

## Examples

```
/blog-search company:stripe
/blog-search tag:agent-sdk
/blog-search keyword:migration
```

## WebMCP tool

Uses the `search-blogs` WebMCP tool under the hood. Results include company name, slug, URL, and tags.
