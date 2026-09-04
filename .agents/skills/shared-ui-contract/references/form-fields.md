# TanStack Form fields

Read this file only for `FormField`, a TanStack Form adapter, typed field names, or label/control/error association.

## Layer contract

- `FormField` registers `form.Field`, normalizes the first string or Standard Schema issue, and injects control ID, `aria-describedby`, and `aria-invalid`.
- Thin adapters take `form` plus a typed `name`, bind through `form.Field`, and read `field.state.meta.errors`; they do not accept an `error` prop.
- `FieldForm<T>` exposes only `Field`; `DeepKeys` and `DeepKeysOfType` reject misspelled or wrong-value-kind names.
- Server errors written to `errorMap.onServer` render through the same association.
- Standard Schema validation does not replace submit values with the transformed output; the feature schema `parse`s the submitted values before the request mapper (form-workflow).
- Primitives remain form-library-neutral. Feature schema, defaults, options Query, conditional behavior, normalization, copy, and payload mapping remain outside adapters.

The approved adapter vocabulary is `FormTextField`, `FormSelectField`, `FormMultiSelectField`, `FormComboboxField`, `FormCheckboxField`, `FormRadioGroupField`, `FormDateField`, `FormDateRangeField`, `FormPermissionTreeField`, `FormFileField`, `FormSubmitButton`, and `FormCancelButton`. Add no alias or unneeded adapter. `FormTextField` alone may expose the approved read-only display branch without registering a field.

## Adapter values

| Adapter | Form value | Empty | Control |
| --- | --- | --- | --- |
| `FormTextField` | `string` | `''` | `Input`; the read-only branch renders text and registers nothing |
| `FormSelectField` | `string` | `''` ↔ primitive `null` | `Select`; `state`/`onRetry` render `AsyncFieldBoundary` in place of the control for server-backed options; `onValueChange(value)` fires after the value is committed |
| `FormComboboxField` | `string` (+ local search string) | `''` ↔ `null` | `Combobox` |
| `FormMultiSelectField` | `string[]` | `[]` | `MultiSelect` |
| `FormCheckboxField` | `boolean` | `false` | `Checkbox` |
| `FormRadioGroupField` | `string` | `''` | `RadioGroup` (named via `labelId`) |
| `FormDateField` | `'YYYY-MM-DD' \| ''` | `''` ↔ `undefined` | `Calendar` |
| `FormDateRangeField` | `{ from: string; to: string }` | `''` each; the other bound becomes `min`/`max` | two `Calendar`s in one named group |
| `FormFileField` | `{ kind: 'empty' } \| { kind: 'existing'; name } \| { kind: 'selected'; file } \| { kind: 'removed' }` | `{ kind: 'empty' }` | `FileInput` (named by `selectLabel`) + remove button |
| `FormPermissionTreeField` | `string[]` leaves | `[]` (or all when `emptyMeansAll`) | `CheckboxTree` |

`FormField` hands the adapter `control.id`/`aria-describedby`/`aria-invalid` plus `labelId` and renders the label by `labelTarget`: `control` (default) is `<label htmlFor={control.id}>`, so `control.id` must sit on one labelable element; `group` is `<span id={labelId}>` for a composite that names itself with `role="group" aria-labelledby={labelId}` (a `label[for]` aimed at a wrapper names nothing and moves focus nowhere). Current composite wiring: `FormSelectField` names the Radix `role="combobox"` trigger with `aria-labelledby={labelId}` only — the trigger's text is already its value, so listing the trigger's own id would read the selection twice (2026-09-03; the earlier `"labelId controlId"` self-reference was a defect, not intent); `FormDateRangeField` uses `labelTarget="group"`, keeps `control.id`/`aria-describedby`/`aria-invalid` on the group, and names each `Calendar` with its own from/to label; `FormFileField` names the input with `selectLabel`. `FormDateField` uses `labelTarget="group"` too: `Calendar` exposes a `role="group"` container rather than one labelable control, so the label is the group name (`aria-labelledby={labelId}`). Screen-reader announcement is unmeasured; the DOM contract above is what the tests hold.

## Form action and save surfaces

- `FormSubmitButton({ pending, children? })` renders the submit button and disables it while pending; `FormCancelButton({ onClick, disabled?, children? })` is always `type="button"`. Both default to the product-wide `shared:formAction.save/cancel` labels (저장/취소, confirmed across the create/edit inventory); pass `children` only for a screen whose label differs.
- `useSaveForm({ schema, defaultValues, sections, save, mapError, onDone })` returns `form`, `sections`, `stage`, `submit`, `guard`, and `dialogs`. It owns the form instance, the single save stage, invalid-submit reveal/focus, server error placement, and the guard. `dialogs` is the one node the caller renders: the guard's dialog plus `FormSaveDialogs` (confirm → acknowledge pair, `shared:formSave.*` copy) fed from `stage.kind` and `submit`. `FormSaveFailureMessage({ failure })` renders the root line from `shared:formError.*` when `stage.kind === 'failed'`. Forms without the confirm/acknowledge pair do not use this hook (form-workflow).
- `useUnsavedChangesGuard({ when, refuseSilently? })` returns `{ dialog, leave }` (`useSaveForm` calls it with `when: isDirty, refuseSilently: isPending` and renders `dialog` inside `dialogs`). It blocks Router navigation while `when` is true; with `refuseSilently` it refuses the leave without a dialog (the progress overlay already says to wait and would cover the question) and renders `shared:unsavedChanges.*` for navigation the user did not start from the form, or `shared:formCancel.*` when the leave came through `leave(navigate)` (the cancel button); a clean form's `leave` navigates without asking. `UnsavedChangesGuard.tsx` is the one shared file allowed to import the Router. There is no separate cancel dialog (ADR 0010).
- `useFormSections(sections: Record<Section, readonly Field[]>, { invalidFields? })` returns `sectionProps(section)` → `{ open, onOpenChange, keepMounted: true, errorCount }` for `SectionCard` and `revealInvalid(failedFieldNames)`, which opens every section holding a failed field and returns the first failed field in declared order (the caller moves focus). Sections start open. `invalidFields` is the caller's selection from its form store — every field whose `fieldMeta.errors` is non-empty, client or `onServer` alike — so `errorCount` counts distinct invalid fields per section with the same source as the inline messages. It knows no schema or form library. Pass the whole `sectionProps(section)` object to `SectionCard`; a hand-written `{ open, onOpenChange }` drops `keepMounted` and the badge.

Read the control-specific reference for selection or date/file behavior. Test typed binding, label/control/error association, client and server errors, required/disabled semantics, and focus for the adapter actually changed.

`FormPermissionTreeField`/`CheckboxTree` express a one-dimensional tree of leaf values. The product's permission matrix (접근권한: menu hierarchy rows × function columns with per-column select-all) is two-dimensional; compose it feature-first from `Table` and `Checkbox` and promote a grid mechanic only after a second consumer with the same keyboard and selection lifecycle.
