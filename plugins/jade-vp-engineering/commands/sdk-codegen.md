---
description: "Generate an SDK from an OpenAPI spec using Stainless"
argument-hint: "SPEC_FILE [--language ts|python|go|ruby|java] [--output DIR]"
---

# /sdk-codegen

Generates a typed SDK from an OpenAPI or AsyncAPI specification using the
Stainless SDK generation methodology.

## Arguments

| Arg | Description |
|-----|-------------|
| `SPEC_FILE` | Path to OpenAPI 3.x or AsyncAPI 2.x spec |
| `--language` | Target language (default: `ts`) |
| `--output` | Output directory (default: `sdk/`) |

## What it does

1. Validates the OpenAPI spec.
2. Generates idiomatic client code with full type safety.
3. Produces pagination helpers, retry logic, and error types.
4. Writes a `README.md` with usage examples.

## Stainless patterns applied

- Resource-based organisation (not path-based)
- Auto-pagination for list endpoints
- Configurable retry with exponential backoff
- Streaming support for SSE endpoints
- Zod schemas for runtime validation

## Example

```
/sdk-codegen openapi.yaml --language ts --output packages/sdk/
```
