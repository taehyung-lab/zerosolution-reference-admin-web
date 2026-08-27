---
name: shared-ui-contract
description: Use when adding or changing shared Radix and Tailwind UI, DataTable or form-field patterns, dialogs, i18n UI contracts, accessibility behavior, React Compiler performance boundaries, or promoting feature code to shared.
---

# Shared UI Contract

Share stable behavior, not a guessed resource framework. Source-owned UI remains replaceable only when it has no domain, API, router, cache, permission, or workflow knowledge.

## Read only what applies

- Creating or promoting a primitive, pattern, table, form field, or dialog: read [references/promotion.md](references/promotion.md).
- Field, select/combobox, date/time, file, or field-array contract: read [references/field-and-select.md](references/field-and-select.md).
- Dialog, blocking/access/session state, badge, toast, or notification surface: read [references/dialog-and-status.md](references/dialog-and-status.md).
- React Compiler, TanStack Table v9 subscriptions, rerenders, memoization, effects, or lazy loading: read [references/react-performance.md](references/react-performance.md).
- A feature workflow also requires [feature-contract](../feature-contract/SKILL.md); server state requires [api-contract](../api-contract/SKILL.md).

## UI layers

1. `shared/ui/primitives`: source-owned Radix primitive plus Tailwind tokens and accessibility behavior.
2. `shared/ui/patterns`: domain-neutral composition proven by real screens.
3. `shared/ui/form`: thin RHF adapters around primitives and `FieldShell`.
4. `features/*/**`: columns, status UI, forms, permissions, workflow dialogs, and all domain-aware components.

Only `shared/ui/primitives` imports Radix directly. Shared UI must not accept a resource name, server DTO, query result, permission code, or mode switch that selects domain behavior.

Do not prebuild a component catalog. “Approved” means the current requirement needs the screen, not that reuse seems likely. Add the minimum primitive or pattern required by that screen, then test its interaction contract. A source-owned accessibility/token primitive starts at first use. Figma repetition may establish a documented interaction contract when semantics, state transitions, and failure behavior match; build a shared pattern only when the current screen needs that domain-free contract.

## Common mistakes

- Promoting on visual similarity or a mechanical third occurrence
- Building `ResourcePage`, schema forms, permission buttons, or universal CRUD tables
- Putting translation fragments, domain keys, navigation, toast, or mutation handling inside primitives
- Adding memoization or virtualization without a specific identity contract or measurement
