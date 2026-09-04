# TanStack Query and cache

Read this file only for query options, loader prefetch, mutations, query keys, cache updates, or invalidation.

## Ownership

Each domain owns its API integration:

```text
features/{domain}/api/
├── keys.ts
├── queries.ts
└── mutations.ts
```

- `keys.ts` is a leaf public cache-address module; it does not import feature UI, model, hooks, queries, or mutations.
- A confirmed cross-domain reference-data operation may expose `reference-queries.ts` as a second leaf public module. Do not create it before a second real consuming domain exists.
- Export reusable `queryOptions` so routes and screens share one definition. `features/{domain}/api/**` declares options, keys, and contract types only; it imports no TanStack execution hook (`useQuery`, `useMutation`, `useQueryClient`, … — `no-restricted-imports`, ADR 0011). The hook that runs an option lives beside the workflow that consumes it (`list/use{Domain}ListData`, `detail/use{Domain}Detail`, `form/use{Domain}EditDetail`).
- A required single-record query (detail, edit load) runs through `useDetailQuery(options)` from `src/api/required-query.ts`; it owns the `ready | error | notFound` decision and the incident/not-found/cached-data priority so screens never re-derive them. List queries keep their own facts.
- Query progress is explicit: screen-entry primary requests spread `blockingProgress`, mounted content transitions spread `contentProgress`, and option/lookup `queryOptions` spread `inlineProgress` (all from `src/api/query-meta.ts`). AppShell does not infer blocking from a missing meta value. Option queries usually use `staleTime: Infinity`; `Register.queryMeta` is typed centrally and features do not add ad-hoc meta keys.
- Add a custom hook only when it adds stable feature policy. A server-backed select is one such boundary when the hook runs the raw `queryOptions` and uses Query `select` to expose feature-owned `{ value, label }` options. Keep the exported query function raw so loaders warm the same cache entry and another consumer can project it differently. Screens and forms consume the hook; they do not repeat `useQuery` plus mapping. Do not add a generic endpoint/config-driven option hook or wrap an already UI-ready query mechanically.
- Query functions call generated operations and return the declared response or an explicitly named feature model.
- Request mapping belongs beside the feature form/model, not in a shared transport layer.

## Keys

Use a hierarchical domain-local factory. A list key contains canonical search params; a detail key contains the stable ID. While the localized response families remain unconfirmed, every API-backed key uses `localizedQueryKey(uiLocale, ...segments)` so the common root is `['api', uiLocale, ...segments]`. ADR 0005 owns the reason and the condition for narrowing this policy; do not implement that disposal condition inside a feature key factory.

Do not rebuild another domain's key from string literals. A confirmed cross-domain cache effect imports only that domain's leaf `api/keys.ts`; it never imports its queries, mutations, model, hooks, or UI. Routes do not own cache consequences.

## Shared reference data

Repeated option data does not justify repeated requests or a global option store. A consuming feature may import another domain's leaf `api/reference-queries.ts` only when all are confirmed:

- the same OpenAPI operation, auth scope, response meaning, Query key, and cache policy serve both domains
- a second real domain consumes the data
- the module returns the declared DTO or feature reference model, never `SelectOption`, translated copy, or UI state
- each consuming feature maps its own labels/options and owns remote-search state

If any condition differs, keep separate feature queries. Never mirror reference data in Zustand.

## Loader and screen

Route loaders and screens use the same exported query options. Router trigger and waiting rules are owned by [router.md](../../feature-contract/references/router.md). Components never call generated operations, assemble raw keys, or copy server data into local state.

Mutation and invalidation rules are owned by [mutations.md](mutations.md).
