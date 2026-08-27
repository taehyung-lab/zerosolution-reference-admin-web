# Fields and selection controls

Read this file when creating or changing a form field, select, combobox, multiselect, date/time control, file field, or field array.

## Layer contract

- `shared/ui/primitives` owns native/Radix/cmdk/react-day-picker mechanics, tokens, focus, keyboard, and accessible roles.
- `shared/ui/patterns/FieldShell` creates or accepts the control ID and injects the resulting ID, `aria-describedby`, and `aria-invalid` contract into its control slot. Adapters and callers do not hand-wire that association repeatedly.
- `shared/ui/form` contains thin RHF adapters. Native inputs use `register` when their value contract remains native; controlled composites use `useController`.
- The feature owns Zod schema, defaults, options Query, conditional fields, normalization, validation copy, and payload mapping.

An accessibility or design-token invariant requires a source-owned primitive from its first use, even though a feature composition still follows the normal promotion test. This resolves the primitive-import boundary without treating one screen as proof of a shared workflow.

## Four public selection controls

Expose four explicit controlled contracts; do not combine behavior with `multiple`, `searchable`, or domain `mode` booleans.

| Control         | Search | Value          |
| --------------- | ------ | -------------- |
| `Select`        | no     | one ID or null |
| `Combobox`      | yes    | one ID or null |
| `MultiSelect`   | no     | ID array       |
| `MultiCombobox` | yes    | ID array       |

All four public controls live in `shared/ui/primitives`. `Select` uses Radix Select. `Combobox`, `MultiSelect`, and `MultiCombobox` share Radix Popover + cmdk selection mechanics; `MultiSelect` omits the search input. Public value and callback types remain distinct, and the shared internal foundation is not exported as a mode-heavy public component.

- The feature owns local or remote option search. For remote search it owns debounce, Query key, pending/error state, and result mapping; the control receives controlled `searchValue`, `onSearchValueChange`, and options.
- A remote control also receives an explicit `status: 'idle' | 'pending' | 'error'`, resolved `emptyLabel`/`errorLabel`/`unavailableLabel`, `getRemoveLabel(item)`, and `formatOverflowCount(count)`. It renders state and accessible copy but does not choose or translate it.
- Multi-value trigger text is the first resolved label plus `+N`. Render removable selected chips/tokens below by default; every remove action has a translated accessible name.
- Current results and selected render items are separate inputs. The feature keeps a screen-scoped, bounded registry of selected `{value,label,description?}` items so remote pagination/search cannot erase labels. This is UI identity, not authoritative server data, and must not enter Zustand or replace Query cache.
- If a selected ID has never been resolved, show the declared unavailable-label fallback and retain the ID; do not invent a label or silently drop the selection.
- Custom entry is a separate `CreatableCombobox` contract only when product and server validation explicitly support it.
- A consequential selection change keeps RHF's committed value unchanged, stores one local candidate, and opens a declarative confirm. Confirm calls `setValue`; cancel discards the candidate. The candidate is not an RHF mirror.

## Date, time, file, and arrays

- Use `react-day-picker` + `date-fns` for calendar presentation. Date-only values are `YYYY-MM-DD`, time-only values are `HH:mm`, and an instant is an ISO string with an explicit offset or `Z`. Do not keep `Date` objects in form values or API payload models.
- A range is `{ from, to }` with the same value kind. Cross-field order validation belongs to feature Zod. The app timezone provider owns the confirmed IANA zone. Pure conversions live in `shared/lib/datetime` and always receive that zone; the feature owns which boundaries enter its request.
- A file field uses a discriminated value such as `empty | existing | selected | removed`, shows confirmed constraints, and preserves the selected file after recoverable failure.
- A repeating field uses `useFieldArray`; register the array at its real path. Row semantics and minimum/maximum policy stay in feature Zod. Do not seed rows implicitly from ambient `FormProvider` state.

## Never

- Repeating label/required/error/ARIA markup in every adapter
- Domain default options, Query calls, i18n key props, payload normalization, or confirmation side effects inside a control
- Alias components for the same behavior or deprecated compatibility props in a new project
- Truncating user input to satisfy `maxLength`; reject the extra edit or validate it visibly
