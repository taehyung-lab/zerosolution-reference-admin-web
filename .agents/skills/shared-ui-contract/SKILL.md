---
name: shared-ui-contract
description: Use when adding or changing shared Radix and Tailwind UI, DataTable or form-field patterns, dialogs, i18n UI contracts, accessibility behavior, shared state mechanics or pure utilities, React Compiler performance boundaries, or promoting feature code to shared. Not for feature-local screens or workflows, route state, or server contract work.
---

# Shared UI Contract

구현 요청이면 이 문서로 오기 전에 [screen-loop](../screen-loop/SKILL.md)에서 요구사항·결과 경계·근거·검증 방법을 고정한다.

Share stable behavior, not a guessed resource framework. Source-owned UI remains replaceable only when it has no domain, API, router, cache, permission, or workflow knowledge.

## Read only what applies

| Request | Read |
| --- | --- |
| What a shared unit takes, owns, and refuses — any `shared/ui`, `shared/model`, `shared/lib`, or `src/api` unit by name | the unit's row in [catalog.md](references/catalog.md) (`Primitives`, `Form`, `Filter`, `List`, `Detail`, `Dialog`, `Feedback`, `Model`, `Lib`, `API`) |
| Promoting, confirming, narrowing, demoting, or deleting a shared unit; a caller that needs a new prop | [promotion.md](references/promotion.md) |
| Radix/Tailwind primitive internals, focus, keyboard, tokens, which selection control, React Compiler, TanStack Table v9 | [primitives-and-tokens.md](references/primitives-and-tokens.md) |
| Translation namespaces, adding a key, product-generic copy, locale parity | [i18n.md](references/i18n.md) |
| How a screen composes these units | [feature-contract](../feature-contract/SKILL.md) (`list.md`, `detail.md`, `form.md`) |
| Server state, keys, mutations | [api-contract](../api-contract/SKILL.md) |

File creation, relocation and feature-local reuse placement follow [folder-structure-contract](../folder-structure-contract/SKILL.md). This skill owns whether a contract is domain-free enough to be shared.

## UI layers

1. `shared/ui/primitives`: source-owned Radix primitive plus Tailwind tokens and accessibility behavior.
2. `shared/ui/{dialog,feedback,filter,list,detail,layout}`: domain-neutral composition proven by real screens, grouped by the render contract it owns.
3. `shared/ui/form`: thin TanStack Form adapters around primitives and `FormField`, plus the save lifecycle (`useSaveForm`).
4. `shared/model` (state lifetime and policy values), `shared/lib` (pure calculation), `src/api` (query/mutation projection above transport).
5. `features/*/**`: columns, status UI, forms, permissions, workflow dialogs, and all domain-aware components.

Only `shared/ui/primitives` imports Radix directly. Shared UI must not accept a resource name, server DTO, query result, permission code, or mode switch that selects domain behavior. A pattern may read the `shared` translation namespace only when confirmed product-generic copy is part of its own interaction contract; domain nouns, feature labels, and workflow-specific wording remain caller-owned.

Do not prebuild a component catalog. "Approved" means the current requirement needs the unit, not that reuse seems likely. Add the minimum primitive or pattern required by that screen, then test its interaction contract. The `Form*Field` adapter set in the catalog is the one declared exception: it stays for the declared input kinds even with zero consumers, and no alias is added beside it.

## Common mistakes

- Promoting on visual similarity or a mechanical third occurrence
- Building `ResourcePage`, schema forms, permission buttons, or universal CRUD tables
- Putting translation fragments, domain keys, navigation, toast, or mutation handling inside primitives
- Adding memoization or virtualization without a specific identity contract or measurement
- Adding a prop to a shared unit so that one caller fits instead of composing feature-locally
