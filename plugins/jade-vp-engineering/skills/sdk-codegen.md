# SDK Codegen Skill — Stainless Integration

## Activation

Auto-fires when:
- An OpenAPI or AsyncAPI spec is detected in the workspace
- The user runs `/sdk-codegen`
- A PR touches an `openapi.yaml` or `asyncapi.yaml` file

## Stainless SDK methodology

### Resource-first organisation
Group endpoints by resource, not HTTP method:

```typescript
// ✓ Resource-based
client.users.create(...)
client.users.list(...)

// ✗ Path-based (avoid)
client.post('/users', ...)
client.get('/users', ...)
```

### Auto-pagination pattern

```typescript
for await (const user of client.users.list()) {
  console.log(user.id);
}
```

### Retry logic (exponential backoff)

```typescript
const client = new JadeClient({
  maxRetries: 3,
  timeout: 30_000,
});
```

### Streaming SSE

```typescript
const stream = await client.messages.stream({ ... });
for await (const event of stream) { ... }
```

### Error hierarchy

```
JadeError
├── APIError (4xx / 5xx)
│   ├── AuthenticationError (401)
│   ├── PermissionDeniedError (403)
│   ├── NotFoundError (404)
│   └── RateLimitError (429)
└── NetworkError (connection issues)
```

## Output checklist

- [ ] `src/resources/` — one file per resource
- [ ] `src/types.ts` — all request/response types
- [ ] `src/errors.ts` — error hierarchy
- [ ] `src/pagination.ts` — pagination helpers
- [ ] `src/streaming.ts` — SSE helpers (if applicable)
- [ ] `README.md` — installation + quick-start
- [ ] `tests/` — basic smoke tests per resource
