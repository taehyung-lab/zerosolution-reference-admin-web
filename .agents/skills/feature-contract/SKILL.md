---
name: feature-contract
description: Use when changing routes, feature screens, hooks, list search or filters, detail views, RHF forms, dialogs, loading, bulk actions, file workflows, navigation, or feature state ownership.
---

# Feature Contract

Keep URL, server, form, and UI state under one clear owner. A screen may orchestrate a use case; it must not become a second router or API layer.

## Read only what applies

- Route, params/search validation, guard, loader, preload, or navigation entry: read [references/router.md](references/router.md).
- List, filter, search, table, selection, detail, loading, or bulk: read [references/list-detail.md](references/list-detail.md).
- Create/edit form, mutation, dialog, file, validation, navigation, or server field error: read [references/form-actions.md](references/form-actions.md).
- New list/detail/form/analytics/matrix/notification screen skeleton or app metadata ownership: read [references/screen-anatomy.md](references/screen-anatomy.md).
- API payload or cache work also requires [api-contract](../api-contract/SKILL.md).
- Shared component creation or promotion also requires [shared-ui-contract](../shared-ui-contract/SKILL.md).

## Boundaries

- Route ownership and loader/preload rules are owned by [references/router.md](references/router.md).
- `features/{domain}` owns `api/`, `model/`, `list/`, `detail/`, `form/`, use-case state, domain UI, schemas, and mapping. Form schema/defaults/request mapper live under `form/` unless shared by multiple views, then move only the stable model to `model/`.
- There is no `pages` layer. Features do not import another feature's UI, model, or hooks; a route composes multiple screens. Cross-feature API leaf exceptions are limited to the cases defined by [api-contract](../api-contract/references/query-cache.md).
- Components do not call generated operations or reconstruct query keys.
- Hooks have one state or behavior owner. Do not bundle query, mutation, form, dialog, toast, navigation, and permission into a page controller hook.
- Do not build `useCrud`, `ResourcePage`, universal list/form descriptors, or a resource framework around feature workflows.

Do not infer permissions, statuses, bulk semantics, upload limits, or post-success navigation. Stop with the unresolved contract when code and requirements cannot answer them.

## Common mistakes

- Mirroring URL filters in persistent component state
- Blocking the whole screen for every mutation
- Hiding business workflow inside a generic list, form, dialog, or upload hook
