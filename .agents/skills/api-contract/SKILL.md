---
name: api-contract
description: Use when changing OpenAPI snapshots, generated clients, Axios transport, feature API modules, TanStack Query keys, queries, mutations, payloads, cache, or server error handling.
---

# API Contract

Treat the committed OpenAPI snapshot as the declared server contract and keep generated code replaceable.

## Read only what applies

- Snapshot, Orval, generated output, or contract mismatch: read [references/openapi.md](references/openapi.md).
- Axios, envelope, business error, auth refresh, locale header, or transport incident: read [references/transport.md](references/transport.md).
- Query key, loader prefetch, query, mutation, invalidation, or optimistic update: read [references/query-cache.md](references/query-cache.md).

## Boundaries

- Only `features/*/api/**` imports `src/api/generated/**`.
- Routes, screens, and components never import Axios or generated operations.
- `src/api/http/**` owns the Axios instance, authentication, locale header, cancellation, and transport-error normalization.
- Feature API modules own query options, mutation options, keys, and cache consequences.
- Generated files are never edited or committed.

If runtime behavior contradicts the snapshot, stop and report the endpoint, request/response evidence, and blocked work. Do not hide divergence with casts, optional fields, fallback values, or silent response reshaping. A temporary adapter requires explicit approval, an ADR, tests, and a removal condition.

## Common mistakes

- Generating React Query hooks and treating them as the project API
- Fetching the remote specification during install or build
- Rewriting every generated response type as a Zod schema
- Invalidating broad cache roots when an exact consequence is known
