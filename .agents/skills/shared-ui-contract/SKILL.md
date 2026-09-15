---
name: shared-ui-contract
description: Use when adding or changing shared Radix and Tailwind UI, DataTable or form-field patterns, dialogs, i18n UI contracts, accessibility behavior, shared state mechanics or pure utilities, React Compiler performance boundaries, or promoting feature code to shared. Not for feature-local screens or workflows, route state, or server contract work.
---

# Shared UI Contract

구현 요청이면 이 문서로 오기 전에 [screen-loop](../screen-loop/SKILL.md)에서 요구사항·결과 경계·근거·검증 방법을 고정한다.

Share stable behavior, not a guessed resource framework. Source-owned UI remains replaceable only when it has no domain, API, router, cache, permission, or workflow knowledge.

## Read only what applies

- Source-owned shadcn-style/Radix primitive, Tailwind token, focus, keyboard, or primitive accessibility: read [references/primitives-and-tokens.md](references/primitives-and-tokens.md).
- Promoting, confirming, narrowing, or demoting shared UI/pattern composition: read [references/promotion.md](references/promotion.md). Use the target inventory and judgment document located through `docs/reference/product.json`; the skill does not name a product domain.
- Promoting or demoting a shared state mechanic or pure utility: read [references/logic-promotion.md](references/logic-promotion.md).
- Any `shared/lib` pure function, `shared/model` state mechanic, or policy value: read [references/shared-values.md](references/shared-values.md).
- Translation namespace, adding a key, product-generic copy ownership, or locale parity: read [references/i18n.md](references/i18n.md).
- Filter panel/row, period or keyword filter composition, `useListFilterDraft`, `usePeriodDraft`, or `useKeywordDraft`: read [references/filter-fields.md](references/filter-fields.md), which links the adoption criteria and state API; add the select or date reference only when changing that lower-level contract.
- TanStack Form adapter, `FormField`, label/control/error association, or typed field name: read [references/form-fields.md](references/form-fields.md).
- Select or single-selection adapter: read [references/select.md](references/select.md); add form-fields only for a form adapter.
- Searchable Combobox, remote option search, or custom entry: read [references/combobox.md](references/combobox.md); add form-fields only for a form adapter.
- MultiSelect, selected-label identity, removable tokens, or unavailable selections: read [references/multiselect.md](references/multiselect.md); add form-fields only for a form adapter.
- Inline "전체 | 개별" checkbox filter group, nested checkbox tree, `CheckboxTree` node shape or `emptyMeansAll`: read [references/checkbox-group.md](references/checkbox-group.md).
- Consequential selection confirmation: read [references/selection-confirmation.md](references/selection-confirmation.md) plus the selected control reference.
- Date/time, period, file field, or field array: read [references/date-file-fields.md](references/date-file-fields.md); add form-fields only for a form adapter.
- Dialog primitive, Confirm, Alert, modal focus, or pending close policy: read [references/dialogs.md](references/dialogs.md).
- `SectionCard` or the `Accordion` disclosure: read [references/disclosure-sections.md](references/disclosure-sections.md).
- `PageHeader`, `DetailField`, `DetailStateBoundary`, or `EmptyState`: read [references/page-and-detail-surfaces.md](references/page-and-detail-surfaces.md).
- Save orchestration (`useSaveForm`), dirty-navigation guard (`useUnsavedChangesGuard`), form action buttons, or `FormSaveDialogs`: read [references/form-fields.md](references/form-fields.md) §Form action and save surfaces together with [feature-contract form-workflow](../feature-contract/references/form-workflow.md).
- A standalone `Checkbox` or `FormCheckboxField`: read [references/primitives-and-tokens.md](references/primitives-and-tokens.md) §Native passthrough and [references/form-fields.md](references/form-fields.md) §Adapter values.
- `RadioGroup` or a form radio adapter: read [references/radio-group.md](references/radio-group.md).
- App-wide blocking progress or inert loading surface: read [references/blocking-progress.md](references/blocking-progress.md).
- Access/session incident presentation or error-surface location: read [references/incidents.md](references/incidents.md).
- Badge semantic tone or status rendering: read [references/badge.md](references/badge.md).
- Toast or notification surface: read [references/notifications.md](references/notifications.md).
- DataTable rendering, headers, rows, stable IDs, or table accessibility: read [references/data-table.md](references/data-table.md). Whether a table anywhere on a screen consumes DataTable or stays feature-local is decided in [feature-contract table-composition](../feature-contract/references/table-composition.md).
- List result boundary, toolbar, or summary rendering: read [references/list-result.md](references/list-result.md).
- Pagination or page-size rendering/accessibility: read [references/pagination.md](references/pagination.md).
- React Compiler, TanStack Table v9 subscriptions, rerenders, memoization, effects, or lazy loading: read [references/react-performance.md](references/react-performance.md).
- A feature workflow also requires [feature-contract](../feature-contract/SKILL.md); server state requires [api-contract](../api-contract/SKILL.md).

File creation, relocation and feature-local reuse placement follow [folder-structure-contract](../folder-structure-contract/SKILL.md). This skill owns whether a contract is domain-free enough to promote.

## UI layers

1. `shared/ui/primitives`: source-owned Radix primitive plus Tailwind tokens and accessibility behavior.
2. `shared/ui/{dialog,feedback,filter,list,detail,layout}`: domain-neutral composition proven by real screens, grouped by the render contract it owns.
3. `shared/ui/form`: thin TanStack Form adapters around primitives and `FormField`.
4. `features/*/**`: columns, status UI, forms, permissions, workflow dialogs, and all domain-aware components.

Only `shared/ui/primitives` imports Radix directly. Shared UI must not accept a resource name, server DTO, query result, permission code, or mode switch that selects domain behavior.

A pattern may read the `shared` translation namespace only when confirmed product-generic copy is part of its own interaction contract. Domain nouns, feature labels, and workflow-specific wording remain caller-owned.

Do not prebuild a component catalog. “Approved” means the current requirement needs the screen, not that reuse seems likely. Add the minimum primitive or pattern required by that screen, then test its interaction contract. A source-owned accessibility/token primitive starts at first use. Figma repetition may establish a documented interaction contract when semantics, state transitions, and failure behavior match; build a shared pattern only when the current screen needs that domain-free contract. The explicitly approved form-adapter vocabulary is recorded in [form-fields.md](references/form-fields.md); it is not general permission to prebuild more controls.

## Common mistakes

- Promoting on visual similarity or a mechanical third occurrence
- Building `ResourcePage`, schema forms, permission buttons, or universal CRUD tables
- Putting translation fragments, domain keys, navigation, toast, or mutation handling inside primitives
- Adding memoization or virtualization without a specific identity contract or measurement
