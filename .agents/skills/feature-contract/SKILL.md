---
name: feature-contract
description: Use when changing routes, feature screens, hooks, list search or filters, detail views, forms, dialogs, tables or collections hosted anywhere on a screen, loading, bulk actions, file workflows, navigation, or feature state ownership. Not for domain-free shared UI primitives under src/shared, and not for query key, cache, or transport definitions.
---

# Feature Contract

Keep URL, server, form, and UI state under one clear owner. A screen may orchestrate a use case; it must not become a second router or API layer. Every list, detail, and form in every domain classifies its responsibilities the same way and names each one the same; how many files that produces depends on which responsibilities the screen actually has. The product facts inside them come from that screen's ledger.

## Read only what applies

Pick the reference for the role the request changes. Read a whole file only for a new screen of that role; a partial request reads the section it touches.

| Request | Read |
| --- | --- |
| Route, params/search validation, guard, loader, preload, navigation entry | [router.md](references/router.md) |
| List screen entered by its own route: URL fields, query, filter, result, sorting, row selection, bulk/send/download action | [list.md](references/list.md) |
| Detail: entry, state boundary, sections, history, record actions, entry to edit | [detail.md](references/detail.md) |
| Create/edit form: save lifecycle, fields, options, conditional groups, cancel and dirty leave | [form.md](references/form.md) |
| A row collection hosted inside a screen (a detail section table, a form's repeating rows, a dialog's search results): who owns its rows, params and failure | [collection.md](references/collection.md) plus the host role's section |
| Upload, download, file field transport, retry | [file-workflow.md](references/file-workflow.md) |
| New ordinary screen skeleton, how a screen splits into files, app-shell metadata | [screen-composition.md](references/screen-composition.md) |
| Analytics, permission matrix, notification screen | [specialized-screens.md](references/specialized-screens.md) plus screen composition |
| Shared UI, shared state mechanic, or pure utility creation/promotion | [shared-ui-contract](../shared-ui-contract/SKILL.md) |
| API payload, cache, mutation, unconnected request | [api-contract](../api-contract/SKILL.md) |

Before composing a screen, read its relevant inventory, scenarios and confirmed/open decisions, or observe the original sources where those are missing. Adding a check, a block, a confirmation, a completion — or the sentence that announces one — means matching both its trigger and how the product states it against a ledger sentence or an explicit user decision. Where the ledger only says `필드 강조` or `선택 불가`, use the product's default copy for that error kind. Leave a behavior the ledger does not answer unbuilt and ask; mark only an explicitly allowed stand-in with `TRANSPLANT_PENDING_<ID>`. Passing `i18n:check` proves key parity, never that the product says this. Do not invent product facts from existing code or a sibling screen.

## Boundaries

- Before creating or moving files, read [folder-structure-contract](../folder-structure-contract/SKILL.md), the single owner of placement and import direction.
- `features/{domain}` owns domain workflows. `api/` owns query/mutation options, keys and API-only hooks; `model/` owns domain values, types and pure rules; `screens/{entity}-{role}/` owns one screen; `mechanics/` owns pieces two screens of the domain share.
- There is no `pages` layer. Features do not import another feature's UI, model, or hooks; a route composes multiple screens. Cross-feature API leaf exceptions are limited to the cases defined by [api-contract](../api-contract/references/query-cache.md).
- 제품 enum 의 집합·의미·필수·기본값은 원장, 내부 철자는 feature `model/` 의 한 선언이 소유한다. 화면은 재선언하지 않는다. 서버가 미확정이어도 내부 선언은 확정할 수 있다. raw shape·fixture 공유는 [query-cache](../api-contract/references/query-cache.md#서버-연결-전후의-책임), 실제 wire 대응은 확인된 서버 계약이 소유한다.
- Components do not call generated operations or reconstruct query keys.
- Hooks have one state or behavior owner. Do not bundle query, mutation, form, dialog, toast, navigation, and permission into a page controller hook.
- Separate UI from business rules by ownership, not by forcing every calculation into a hook. Render-local formatting and columns stay near the result UI; URL transitions, Query enablement, payload/cache identity, permission, and workflow decisions stay in `model/` hooks.
- Do not build `useCrud`, `ResourcePage`, universal list/form descriptors, or a resource framework around feature workflows.

권한·status 의미·bulk·업로드 제한·실 저장 성공 후 이동은 추측하지 않는다. 원장·원문에도 답이 없는 영향 부분만 보류한다. 목적지 파일 부재와 API 미연결은 제품 부재가 아니다. 연결 범위는 [screen-loop](../screen-loop/SKILL.md#요청의-종류), 미연결 종착점은 [mutations](../api-contract/references/mutations.md#시나리오-요청)가 소유한다.

## Common mistakes

- Mirroring URL filters in persistent component state
- Adding feature-local whole-screen blocking for a mutation without a confirmed product-wide progress contract
- Hiding business workflow inside a generic list, form, dialog, or upload hook
- Rendering a dialog owner inside a `searched` or `ready` branch
