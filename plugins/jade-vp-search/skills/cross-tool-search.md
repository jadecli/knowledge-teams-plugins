# Cross-Tool Search Skill

## Activation

Auto-fires when the user asks "where is X?", "find Y", or "what docs
exist for Z".

## Search strategy

1. **Parse intent** — extract entity type (code, doc, task, decision)
2. **Fan out** — query each connected source in parallel
3. **Rank** — score by recency, relevance, and source trust
4. **Deduplicate** — merge results that refer to the same entity
5. **Summarise** — present top 5 results with snippets

## Result format

```yaml
search_results:
  query: "..."
  total_found: 12
  results:
    - title: "..."
      source: code | docs | tasks
      path: "..."
      snippet: "..."
      relevance_score: 0.95
      last_modified: "YYYY-MM-DD"
```
