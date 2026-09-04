# Filter fields

Read this file when changing a filter panel, filter row, period filter, keyword filter, or their shared draft mechanics. These contracts apply wherever the same filter surface appears, including a list, detail, form, or dialog; the host screen type does not change shared ownership.

## Composition

| Surface              | Shared owns                                                                  | Caller owns                                                                    |
| -------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `FilterPanel`        | disclosure, field/action layout, accessible form surface                     | submit/reset behavior, field order, labels                                     |
| `FilterField`        | one label/control association; `group` when one label names sibling controls | control semantics and state                                                    |
| `PeriodFilterField`  | optional criterion `Select` + `PeriodField` under one named group            | criterion enum/options/default, preset policy, range validation and conversion |
| `KeywordFilterField` | optional target `Select` + `KeywordChipField` under one named group          | target enum/options/default, keyword validation and commit policy              |
| `AsyncFieldBoundary` | generic loading/error/retry presentation for one field                       | option query and retry operation                                               |

Use `PeriodFilterField` or `KeywordFilterField` when the whole row matches. Use `PeriodField`, `KeywordChipField`, or `FilterField` directly when the host genuinely has a different composition. Do not rebuild the fixed select-plus-field row in each feature.

The optional select slot (`FilterSelectSlot<TValue>`: `label`, `value`, `options`, `onValueChange`) is a controlled string surface only: accessible label, current value, options, and change callback. It does not interpret an enum or choose a default. Labels and options remain caller-owned.

Preset values usually come from `standardPeriodPresetValues` and labels from `usePeriodPresetLabels()` ([shared-values.md](shared-values.md), [i18n.md](i18n.md)); the default preset stays with the caller.

## State boundary

`usePeriodDraft` and `useKeywordDraft` may own domain-free draft transitions. The feature still owns route search, Query gating, request mapping, API payloads, timezone conversion, validation policy, and when a draft commits.

Do not add a schema/config renderer, resource filter framework, URL adapter, Query wrapper, or API-aware option loader to these patterns. Similar appearance is not enough when state transitions or failure behavior differ.

## Data the caller passes

- `FilterPanel({ title, collapseLabel, expandLabel, submitLabel, resetLabel, onSubmit(SubmitEvent<HTMLFormElement>), onReset, children })` — a `form` named by `title` with an uncontrolled disclosure (`aria-expanded`/`aria-controls`); the caller commits in `onSubmit` and returns to `{}` in `onReset`.
- `FilterField({ label, group?, children: ({ labelId, controlId }) => node })` — reading `controlId` in the render prop makes the label a `<label htmlFor>`; not reading it renders a `<span id={labelId}>` for a self-naming composite; `group` wraps the children in `role="group" aria-labelledby={labelId}` for sibling controls (never around `CheckboxTree`, which names itself with `labelId`).
- `AsyncFieldBoundary({ state: 'loading' | 'error' | 'ready', labelledBy, onRetry, children })` — loading is `role="status"`, error is `role="alert"` with a retry button, ready renders children; the feature computes `state` (cached data ⇒ `ready`).
- `KeywordChipField({ items: { field, value }[], pendingValue, onPendingValueChange, onAdd, onRemoveAt(index), addLabel, removeLabel(item), inputLabel, formatItem(item), ariaLabelledby? })` — chips render `formatItem(item)`; the caller decides the "대상 : 값" format.
- `PeriodFilterField({ label, criterion?: FilterSelectSlot, ...PeriodFieldProps })` and `KeywordFilterField({ label, field?: FilterSelectSlot, ...KeywordChipFieldProps })` — the outer row is `FilterField group` named by `label`; the optional select names itself with the slot `label` via `aria-label`; `PeriodField` still needs `presetGroupLabel` for its radios.

## Verification

Test the named group, optional-select path, selection callback, period/range callback, keyword add/remove behavior, and caller-owned error association that changed. A consuming feature test must still prove its enum mapping, draft commit, reset, and request boundary.
