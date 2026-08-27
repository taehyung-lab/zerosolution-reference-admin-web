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
- Export reusable `queryOptions` so routes and screens share one definition.
- Add a custom hook only when it adds stable feature policy; do not wrap every option mechanically.
- Query functions call generated operations and return the declared response or an explicitly named feature model.
- Request mapping belongs beside the feature form/model, not in a shared transport layer.

## Keys

Use a hierarchical domain-local factory. A list key contains canonical search params; a detail key contains the stable ID. Include locale only when the server response is localized.

Do not rebuild another domain's key from string literals. A confirmed cross-domain cache effect imports only that domain's leaf `api/keys.ts`; it never imports its queries, mutations, model, hooks, or UI. Routes do not own cache consequences.

## Shared reference data

Repeated option data does not justify repeated requests or a global option store. A consuming feature may import another domain's leaf `api/reference-queries.ts` only when all are confirmed:

- the same OpenAPI operation, auth scope, response meaning, Query key, and cache policy serve both domains
- a second real domain consumes the data
- the module returns the declared DTO or feature reference model, never `SelectOption`, translated copy, or UI state
- each consuming feature maps its own labels/options and owns remote-search state

If any condition differs, keep separate feature queries. Never mirror reference data in Zustand.

## Mutations

- Mutations own the server call and declared cache consequence.
- The calling screen owns navigation, toast wording, and dialog closure.
- Prefer exact cache updates or invalidation. Invalidate a list family only when the mutation can change unknown membership or ordering across several active list variants; record that semantic reason beside the mutation. Enumerate affected families; a root key is allowed only when that root itself is the confirmed aggregate family and narrower membership cannot be known.
- Do not retry mutations automatically.
- Optimistic updates require a rollback test and a material UX benefit.
- Field errors are normalized and handed to the form; transport code does not know RHF.

Use direct, awaited cache consequences by default. Introduce `meta.invalidates` with a key-agnostic `MutationCache` dispatcher only after local declarations are observed to drift because of cross-domain fan-out or repeated event consequences. Fan-out alone is not a reason to add the registry. The dispatcher accepts key arrays and never imports a feature. A mutation uses either this path or local `onSuccess` invalidation, not both; keep navigation-critical invalidation on an awaited path.

## Loader and screen

Route loaders and screens use the same exported query options. Router trigger and waiting rules are owned by [router.md](../../feature-contract/references/router.md). Components never call generated operations, assemble raw keys, or copy server data into local state.
