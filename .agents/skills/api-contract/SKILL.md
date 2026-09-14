---
name: api-contract
description: Use when changing OpenAPI snapshots, generated clients, Axios transport, feature API modules, TanStack Query keys, queries, mutations, payloads, cache, or server error handling. Not for screen composition, route or form state, or shared UI presentation, which consume this contract instead of defining it.
---

# API Contract

구현 요청이면 이 문서로 오기 전에 [screen-loop](../screen-loop/SKILL.md) N0에서 왔는지 본다. `src/api`는 infrastructure, `src/features/*/api`는 화면 workflow의 일부라 그 화면 grain을 따른다.

Treat the committed OpenAPI snapshot as the declared server contract and keep generated code replaceable.

## Read only what applies

- Snapshot pull, Orval configuration, generated output, or offline generation: read [references/openapi.md](references/openapi.md).
- Runtime response validation or a server/OpenAPI mismatch: read [references/contract-validation.md](references/contract-validation.md).
- Axios instance, headers, envelope, normalized error, request ID, or transport incident: read [references/transport.md](references/transport.md).
- Access token, refresh cookie, reissue, replay, 401, 403, or cross-tab auth: read [references/auth-session.md](references/auth-session.md).
- `Accept-Language`, localized responses, locale-sensitive query identity, or locale cache reset: read [references/locale-cache.md](references/locale-cache.md).
- Query options, query keys, loader prefetch, reference data, or Query/screen ownership: read [references/query-cache.md](references/query-cache.md).
- Mutation payload, invalidation, exact cache update, optimistic update, or mutation retry: read [references/mutations.md](references/mutations.md).

## Boundaries

- Only `features/*/api/**` and `src/api/**` import `src/api/generated/**`; `eslint.config.js` enforces this.
- Routes, screens, and components never import Axios or generated operations.
- `src/api/http/**` owns the Axios instance, authentication, locale header, cancellation, and transport-error normalization.
- Feature API modules own query/mutation options, keys and API-only execution hooks. Workflow hooks own URL/form/selection decisions and post-mutation cache consequences (ADR 0011).
- File creation, relocation and API input type placement follow [folder-structure-contract](../folder-structure-contract/SKILL.md).
- Generated files are never edited or committed.

If runtime behavior contradicts the snapshot, stop and report the endpoint, request/response evidence, and blocked work. Do not hide divergence with casts, optional fields, fallback values, or silent response reshaping. A temporary adapter requires explicit approval, an ADR, tests, and a removal condition.

## Common mistakes

- Generating React Query hooks and treating them as the project API
- Fetching the remote specification during install or build
- Rewriting every generated response type as a Zod schema
- Invalidating broad cache roots when an exact consequence is known
