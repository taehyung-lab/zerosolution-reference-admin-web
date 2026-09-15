---
name: feature-contract
description: Use when changing routes, feature screens, hooks, list search or filters, detail views, forms, dialogs, tables or collections hosted anywhere on a screen, loading, bulk actions, file workflows, navigation, or feature state ownership. Not for domain-free shared UI primitives under src/shared, and not for query key, cache, or transport definitions.
---

# Feature Contract

Keep URL, server, form, and UI state under one clear owner. A screen may orchestrate a use case; it must not become a second router or API layer.

## Decompose by surface

Select references by the surfaces actually present, not by the page type alone. Start with the reference for the outer surface (route, list, detail, form), then repeat the selection for every inner surface it hosts: filter, table, section, dialog, selection control. A nested surface uses the same reference wherever it appears, so a table inside a detail section, a form, or a dialog reaches the same table path as a list table. Read shared, API, and control references only for the query, mutation, control, or table surface the work actually touches.

## Read only what applies

For screen/workflow work, locate the target through the product evidence entry point before selecting
references. `context` is an optional discovery helper; its inventory-owned index connects evidence and
inner surfaces, while group entries still require decomposition. Explain scope and requirement evidence
in conversation.
A code path is a routing hint, not a screen template. Keep missing evidence explicit.

- Before composing a screen, read its relevant inventory, scenarios and confirmed/open decisions, or observe the original sources where those are missing. The index routes evidence, not policy: decompose group entries and follow linked rules when they affect ownership, exceptions or failure behavior. Read a reference in full only when the work spans it; preserve applicable ancestor constraints. Do not invent product facts from existing code.
- Adding a check, a block, a confirmation, a completion — or the sentence that announces one — means matching **both its trigger and how the product states it** against a ledger sentence or an explicit user decision. Where the ledger only says `필드 강조` or `선택 불가`, it states no screen-specific wording: use the product's default copy for that error kind instead of inventing one. Leave a behavior the ledger does not answer unbuilt and ask; mark only an explicitly allowed stand-in with `TRANSPLANT_PENDING_<ID>`. Passing `i18n:check` proves key parity, never that the product says this.
- Route, params/search validation, guard, loader, preload, or navigation entry: read [references/router.md](references/router.md).
- List, filter, search, result state, sorting, or pagination: select the applicable sections of [references/list-workflow.md](references/list-workflow.md). Every filter host uses its [Draft commit adoption criteria](references/list-workflow.md#draft-commit) to choose `useListFilterDraft` or a smaller mechanic. A new list needs its complete lifecycle and composition; a result-only change still needs the Query and URL rules that govern that result.
- Search field schema, defaults, codecs, filter/view partition, date commit or variants: also read [references/list-search-contract.md](references/list-search-contract.md). Consumer defaults are observations, not new-product policy.
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

- Before creating or moving files, read [folder-structure-contract](../folder-structure-contract/SKILL.md), the single owner of placement and import direction.

- Route ownership and loader/preload rules are owned by [references/router.md](references/router.md).
- Screen-internal responsibility decomposition, including existing screens, are owned by [references/screen-composition.md](references/screen-composition.md#feature-internal-decomposition).
- `features/{domain}` owns domain workflows. Screens and domain mechanics separate presentation from execution/state; form schema/defaults/request mapper stay with the consuming workflow, while only genuinely shared pure values move to domain model.
- There is no `pages` layer. Features do not import another feature's UI, model, or hooks; a route composes multiple screens. Cross-feature API leaf exceptions are limited to the cases defined by [api-contract](../api-contract/references/query-cache.md).
- 제품 enum의 집합·의미·필수·기본값은 원장, 내부 철자는 feature `model/`의 한 선언이 소유한다. 화면은 재선언하지 않는다.
  서버가 미확정이어도 내부 선언은 확정할 수 있다. raw shape·fixture 공유는 [query-cache](../api-contract/references/query-cache.md#서버-연결-전후의-책임), 실제 wire 대응은 확인된 서버 계약이 소유한다. generated 타입의 채택은 집합과 의미가 확인된 경우뿐이며 미확인 대응은 기존 이관 sentinel로 남긴다.
- Components do not call generated operations or reconstruct query keys.
- Hooks have one state or behavior owner. Do not bundle query, mutation, form, dialog, toast, navigation, and permission into a page controller hook.
- Separate UI from business rules by ownership, not by forcing every calculation into a hook. Render-local formatting and memoized columns may stay near the result UI; URL transitions, Query enablement, payload/cache identity, permission, and workflow decisions stay in feature logic or focused hooks.
- Do not build `useCrud`, `ResourcePage`, universal list/form descriptors, or a resource framework around feature workflows.

권한·status 의미·bulk·업로드 제한·실 저장 성공 후 이동은 추측하지 않는다. 원장·원문에도 답이 없는 영향 부분만 보류한다. 목적지 파일 부재와 API 미연결은 제품 부재가 아니다. 연결 범위는 [screen-loop](../screen-loop/SKILL.md#요청의-종류), 미연결 종착점은 [mutation-actions](references/mutation-actions.md#api-연결-전-시나리오-요청)가 소유한다.

## Common mistakes

- Mirroring URL filters in persistent component state
- Adding feature-local whole-screen blocking for a mutation without a confirmed product-wide progress contract
- Hiding business workflow inside a generic list, form, dialog, or upload hook
