---
name: feature-contract
description: Use when changing routes, feature screens, hooks, list search or filters, detail views, forms, dialogs, tables or collections hosted anywhere on a screen, loading, bulk actions, file workflows, navigation, or feature state ownership. Not for domain-free shared UI primitives under src/shared, and not for query key, cache, or transport definitions.
---

# Feature Contract

Keep URL, server, form, and UI state under one clear owner. A screen may orchestrate a use case; it must not become a second router or API layer.

## Decompose by surface

Select references by the surfaces actually present, not by the page type alone. Start with the reference for the outer surface (route, list, detail, form), then repeat the selection for every inner surface it hosts: filter, table, section, dialog, selection control. A nested surface uses the same reference wherever it appears, so a table inside a detail section, a form, or a dialog reaches the same table path as a list table. Read shared, API, and control references only for the query, mutation, control, or table surface the work actually touches.

## Read only what applies

- Before composing any screen, read that screen's section of the product inventory (`docs/reference/zero-sol/NN-*.md`: Figma composition, Notion policy sentences, open questions) and the judgment (`docs/reference/zero-sol-figma-analysis.md` §2/§5/§8). Compose only what the inventory shows; record what it does not.
- Route, params/search validation, guard, loader, preload, or navigation entry: read [references/router.md](references/router.md).
- List, filter, search, result state, sorting, or pagination: read [references/list-workflow.md](references/list-workflow.md).
- Any table, repeating rows, embedded collection, or search/selection table, whether it sits in a list, a detail section, a form, or a dialog: read [references/table-composition.md](references/table-composition.md) together with the hosting workflow reference.
- Detail query, detail state, section, action, or edit entry: read [references/detail-workflow.md](references/detail-workflow.md).
- Bulk selection, confirmation, mutation, or partial result: read [references/bulk-actions.md](references/bulk-actions.md).
- Create/edit form, validation, conditional section, dirty state, or server field error: read [references/form-workflow.md](references/form-workflow.md).
- Mutation pending/result, confirmation, alert, toast, or post-success navigation: read [references/mutation-actions.md](references/mutation-actions.md).
- Upload, download, file field transport, or file retry: read [references/file-workflow.md](references/file-workflow.md).
- New ordinary screen skeleton, app shell, or app metadata ownership: read [references/screen-composition.md](references/screen-composition.md).
- Analytics, permission matrix, or notification screen: read [references/specialized-screens.md](references/specialized-screens.md) plus screen composition.
- Error, incident, access, or session presentation also requires [shared-ui-contract](../shared-ui-contract/SKILL.md); transport classification remains in [api-contract](../api-contract/references/transport.md).
- API payload or cache work also requires [api-contract](../api-contract/SKILL.md).
- Shared UI, shared state mechanic, or pure shared utility creation/promotion also requires [shared-ui-contract](../shared-ui-contract/SKILL.md).

## Boundaries

- Route ownership and loader/preload rules are owned by [references/router.md](references/router.md).
- `features/{domain}` owns `api/`, `model/`, `list/`, `detail/`, `form/`, use-case state, domain UI, schemas, and mapping. Form schema/defaults/request mapper live under `form/` unless shared by multiple views, then move only the stable model to `model/`.
- There is no `pages` layer. Features do not import another feature's UI, model, or hooks; a route composes multiple screens. Cross-feature API leaf exceptions are limited to the cases defined by [api-contract](../api-contract/references/query-cache.md).
- Components do not call generated operations or reconstruct query keys.
- Hooks have one state or behavior owner. Do not bundle query, mutation, form, dialog, toast, navigation, and permission into a page controller hook.
- Separate UI from business rules by ownership, not by forcing every calculation into a hook. Render-local formatting and memoized columns may stay near the result UI; URL transitions, Query enablement, payload/cache identity, permission, and workflow decisions stay in feature logic or focused hooks.
- Do not build `useCrud`, `ResourcePage`, universal list/form descriptors, or a resource framework around feature workflows.

Do not infer permissions, statuses, bulk semantics, upload limits, or post-success navigation. Stop with the unresolved contract when code and requirements cannot answer them.

## Common mistakes

- Mirroring URL filters in persistent component state
- Adding feature-local whole-screen blocking for a mutation without a confirmed product-wide progress contract
- Hiding business workflow inside a generic list, form, dialog, or upload hook
