# TanStack Form fields

Read this file only for `FormField`, a TanStack Form adapter, typed field names, or label/control/error association.

## Layer contract

- `FormField` registers `form.Field`, normalizes the first string or Standard Schema issue, and injects control ID, `aria-describedby`, and `aria-invalid`.
- Thin adapters take `form` plus a typed `name`, bind through `form.Field`, and read `field.state.meta.errors`; they do not accept an `error` prop.
- `FieldForm<T>` exposes React `Field` and the installed Form API's `formId`; a core-only `AnyFormApi` is not that binding. Use the declared React Form dependency, not a direct import from transitive `@tanstack/form-core`. `formFieldControlId(form, name)` keeps labels/errors/focus unique across simultaneous forms. `FormField` preserves the selected name's `DeepValue`; `DeepKeys` and `DeepKeysOfType` reject misspelled or wrong-value-kind names.
- Server errors written to `errorMap.onServer` render through the same association.
- Standard Schema validation does not replace submit values with the transformed output; the feature schema `parse`s the submitted values before the request mapper (form-workflow).
- Primitives remain form-library-neutral. Feature schema, defaults, options Query, conditional behavior, normalization, copy, and payload mapping remain outside adapters.

The approved adapter vocabulary is `FormTextField`, `FormSelectField`, `FormMultiSelectField`, `FormComboboxField`, `FormCheckboxField`, `FormRadioGroupField`, `FormDateField`, `FormDateRangeField`, `FormPermissionTreeField`, `FormFileField`, `FormArrayField`, `FormSubmitButton`, and `FormCancelButton`. Add no alias or unneeded adapter. `FormTextField` alone may expose the approved read-only display branch without registering a field.

`FormArrayField({ form, name, minItems = 0, children })` registers one typed array path and exposes its current `items` and errors plus `append`, `prepend`, `insert`, `remove`, `move`, and `canRemove`. It blocks removal at `minItems`; callers hide their remove affordance when `canRemove` is false. The feature owns the item factory, stable item ID, row rendering, Zod row/array validation, and any required minimum. Compose reordering with the form-independent `SortableList({ items: stableIds, onMove, getItemLabel, children })`; the list owns dnd-kit sensors, handle refs, index calculation, and translated accessibility instructions/announcements, while the caller supplies a human-readable item label and the form array remains the order owner.

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

`FormField` hands the adapter `control.id`/`aria-describedby`/`aria-invalid` plus `labelId` and renders the label by `labelTarget`: `control` (default) is `<label htmlFor={control.id}>`, so `control.id` must sit on one labelable element; `group` is `<span id={labelId}>` for a composite that names itself with `role="group" aria-labelledby={labelId}` (a `label[for]` aimed at a wrapper names nothing and moves focus nowhere). Current composite wiring: `FormSelectField` names the Radix `role="combobox"` trigger with `aria-labelledby={labelId}` only — the trigger's text is already its value, so listing the trigger's own id would read the selection twice (2026-09-03; the earlier `"labelId controlId"` self-reference was a defect, not intent); `FormDateRangeField` uses `labelTarget="group"`, keeps `control.id`/`aria-describedby`/`aria-invalid` on the group, and names each `Calendar` with its own from/to label; `FormFileField` names the input with `selectLabel`. `FormDateField` and `FormPermissionTreeField` use `labelTarget="group"` too: `Calendar` exposes a `role="group"` container rather than one labelable control, so the label is the group name (`aria-labelledby={labelId}`). Screen-reader announcement is unmeasured; the DOM contract above is what the tests hold.

## Form action and save surfaces

- `FormSubmitButton({ pending, children? })` renders the submit button and disables it while pending; `FormCancelButton({ onClick, disabled?, children? })` is always `type="button"`. Both default to the product-wide `shared:formAction.save/cancel` labels, whose wording is product-owned; pass `children` only for a screen whose label differs.
- `useSaveForm`의 통합 저장 lifecycle은 제거하고 같은 파일 역할을 `useFormFeedback({ form, fieldOrder, sections?, focusField? })`로 교체한다. existing Form에 붙는 입력 UI adapter이며 schema·validators·query·mutation·guard·saved·reset·onDone을 받거나 생성하지 않는다.
  반환은 `{ sections?, revealAndFocus(fields), clearServerErrors(), setServerErrors(fields) }`다. field 이름은 설치된 React Form의 DeepKeys로 묶고 필요한 store/meta API만 구조적으로 받는다. `FieldForm`만으로 store/meta를 표현하지 않는다.
  invalid submit은 fieldOrder의 실제 fieldMeta 오류를 전달한다. `setServerErrors`는 caller가 분류한 필드만 onServer 공용 문구로 기록해 노출하며 API 오류 자체나 root 실패를 받지 않는다. `clearServerErrors`는 다음 제출 시작에 이 adapter가 다루는 onServer를 지운다.
  sections는 있을 때만 연결한다. reveal은 실제 mounted 결과 뒤 focus하고 서버 오류는 confirm 닫힘/focus 복원이 끝난 뒤 해당 필드로 이동한다. 기본은 formFieldControlId이며 복합 컨트롤은 caller의 focusField로 실제 내부 control을 지정한다. UI 책임이므로 ui에 남긴다.
- `UnsavedChangesProvider` is required above protected app forms. It alone owns the Router blocker and `beforeunload` listener, aggregating registered dirty/pending facts without form values or destinations. `useUnsavedChangesGuard({ when, refuseSilently? })` registers one form and returns `{ dialog, leave, close }`; it has no providerless Router fallback. `close(discard, { when? })` owns local cancel/×/Escape/outside confirmation and may scope the question out only when that action preserves the draft. `leave(navigate)` asks with cancel copy for an explicit form exit, while ordinary Router navigation uses navigation copy. Pending local and Router exits are refused silently; browser exit uses the native warning. The product evidence entry point determines which drafts require protection; [form-workflow](../../feature-contract/references/form-workflow.md#cancel-and-tabs) owns how callers apply that decision. Dirty is `isDirty && !isDefaultValue`, so restoring defaults is clean.
- `useFormSections(sections: Record<Section, readonly Field[]>, { invalidFields? })`는 `sectionProps(section)` → `{ open, onOpenChange, keepMounted: true, errorCount }`와 `revealInvalid(fields)`를 반환한다. sections는 처음 열린 상태이며 schema·Form library는 모른다.
  caller가 실제 store의 `fieldMeta.errors`가 있는 모든 field(client/onServer)를 invalidFields로 전달한다. 닫힌 폼 section도 mounted를 유지하고 같은 오류 원천의 distinct field 개수로 header badge를 표시한다.
  reveal은 오류 section 전체를 열고 첫 field를 선언 순서로 반환하며 focus는 입력 feedback/caller가 수행한다. SectionCard에 sectionProps 전체를 전달해 mount/badge를 보존한다. inactive tab은 독립 단일 선택 상태여서 caller가 노출한다.

Read the control-specific reference for selection or date/file behavior. Test typed binding, label/control/error association, client and server errors, required/disabled semantics, and focus for the adapter actually changed.

`FormPermissionTreeField`/`CheckboxTree` express a one-dimensional tree of leaf values. A two-dimensional selection matrix has different semantics; compose it feature-first from `Table` and `Checkbox` and promote a grid mechanic only after a second consumer with the same keyboard and selection lifecycle.
