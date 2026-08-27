# UI ownership and promotion

Read this file when creating shared UI or deciding whether feature UI should move to `shared`.

## Admission test

One use stays feature-local. Two uses are compared. A third stable use starts review; it does not guarantee promotion. The exceptions are a source-owned primitive with a confirmed accessibility or token invariant and an explicitly approved bootstrap pattern that the current screen actually needs. A bootstrap pattern may start in `shared`, but it remains a candidate until a second real workflow validates the same contract; do not prebuild unused patterns. Promote any other code only when all are true:

- the semantics and interaction lifecycle match
- ownership and failure behavior match
- the public API contains no domain type or server DTO
- no `resource`, `entity`, domain `mode`, permission, router, Query, or mutation branch is needed
- one implementation reduces real change or defect cost

Accessibility or design-token invariants require a source-owned primitive from first use because feature code cannot import Radix directly. An approved bootstrap pattern may also start shared when it contains only the domain-neutral mechanics already named by the project design. Neither exception authorizes a feature workflow or speculative catalog. Record the invariant or approved contract; do not use “we may reuse it” as evidence.

Repeated Figma instances count as design evidence only when the same semantics, state transitions, and failure behavior are legible and match. They may establish a documented interaction contract before three code uses. A contract records those invariants; it is not automatically a component. Build a shared pattern only when the current screen needs the domain-free contract. Visual similarity alone does not authorize a component catalog.

In the change or completion report, name the compared call sites, matching semantics/lifecycle, removed duplication or defect risk, and the resulting domain-free public API. If those facts cannot be shown, keep the implementations local.

Adding a domain `mode`, schema injection, resource switch, or callback override to absorb one exceptional caller is a demotion signal. Return that caller to feature-local code and narrow the shared contract instead of growing an option framework.

## Contracts

### Primitive

Own Radix wiring, native semantics, focus, keyboard behavior, Tailwind tokens, and visual variants. It receives visible content and callbacks. It knows no feature or translation namespace.

### Pattern

Compose primitives around domain-neutral behavior. Appropriate examples include ConfirmDialog, Pagination, EmptyState, FieldShell, and a controlled DataTable frame. A pattern may receive translated labels but does not choose domain copy.

### Form adapter

Lives in `shared/ui/form`. It connects RHF to a primitive and `FieldShell` only. A native control whose value contract remains native uses `register`; a controlled composite uses `useController`.

### Feature UI

Own columns, filter fields, status badges, forms, domain copy, permissions, navigation, mutation state, and workflow dialogs.

## Pattern limits

- DataTable owns table rendering mechanics, accessibility, stable row identity, and controlled callbacks. URL state, Query responses, data fetching, columns, permissions, pagination UI/policy, empty/error copy, and feature controllers stay outside it.
- `FieldShell` owns label/control/error association. Form adapters own RHF connection only. Schema, defaults, conditional fields, normalization, and payload mapping stay in the feature. Selection and date/file specifics are in [field-and-select.md](field-and-select.md).
- Confirm and Alert own interaction semantics. A form modal is feature UI composed from Dialog primitives.

## i18n and accessibility

Maintain identical `ko`, `en`, and `ja` key sets in CI and fail on missing keys at runtime tests. Do not concatenate translated fragments or assume Korean word order. Use `Intl` for locale-sensitive dates and numbers.

Icon-only actions have translated accessible names; errors and descriptions are associated with controls. Dialog tests cover title/description, initial focus, focus restoration, Escape/outside-click policy, and pending behavior. Async status uses an appropriate live region. Run automated accessibility checks plus focused keyboard tests for changed interactive primitives.
