---
command: blog-sync
description: Trigger a full crawl of all 188 customer blog posts
usage: /blog-sync
---

# Blog Sync

Crawls all customer blog posts from claude.com/customers/* and updates the Neon cache.

## What it does

1. Reads the blog manifest (188 URLs)
2. Fetches each post with concurrency control (5 workers)
3. Compares SHA-256 content hashes against cached versions
4. Only persists posts where content has changed
5. Reports: updated count, unchanged count, errors

## When to use

- After adding new entries to the blog manifest
- To verify the weekly cron job is working correctly
- Before running simulation tests that depend on fresh blog data

## CLI equivalent

```bash
npm run blog:sync
```
