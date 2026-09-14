# Checkbox group and tree

Read this file only for a "전체 | 개별" multi-select filter group, a nested checkbox tree, or `CheckboxTree` rendering. Dropdown-style multi-selection is [multiselect.md](multiselect.md); a permission matrix is [form-fields.md](form-fields.md).

## Which control

- Options are few, all visible at once, and the product shows them inline with a leading 전체 — `CheckboxTree` (every inline multi-select filter group in the inventory).
- Options are many, searched, or shown as removable tokens — `MultiSelect`.
- Rows × function columns with per-column select-all — a feature composition of `Table` + `Checkbox`; `CheckboxTree` supplies only the row-hierarchy algebra.

## Data the caller passes

`nodes` is one shape for every depth; the control decides nothing from a `mode`.

```ts
// flat (one level): every node is a leaf
[{ value: 'WEB', label: 'WEB' }, { value: 'APP', label: 'APP' }]

// nested (two or more levels): a branch has `label` + `children` and no `value`
[{ label: '상위 A', children: [{ value: 'A1', label: '하위 A1' }, { value: 'A2', label: '하위 A2' }] },
 { label: '상위 B', children: [{ value: 'B1', label: '하위 B1' }, { value: 'B2', label: '하위 B2' }] }]
```

- `values` and `onValueChange` carry **leaf values only**. A branch is never a value; its checked state is derived (checked when any descendant is selected), and clicking it selects or clears every descendant.
- The leading 전체 control is checked only when every leaf is selected; clicking it selects or clears all leaves.
- `emptyMeansAll` maps "everything selected" to `[]`. Use it when the server treats an omitted filter as no restriction, so the canonical URL and request omit the array (list-workflow: omit empty arrays). Without it, `[]` means nothing selected.
- With `emptyMeansAll`, clearing the entire group returns to unrestricted/all; it does not create a select-none state. To keep only one leaf, deselect the other leaves. Test the emitted values as well as the visible checks.
- Labels are already translated strings; server enum meaning, option source, and the default stay with the feature. Async options render inside `AsyncFieldBoundary` with the feature-decided state.
- A flat group renders inline (전체 | a b c) as the design shows; a nested group renders an indented list. Nesting depth is not limited.

## Accessibility

`CheckboxTree` names itself: pass `FilterField`'s `labelId` as `ariaLabelledby` and do **not** use `FilterField group` around it, or the name is announced twice. Each item is `role="checkbox"` with `aria-checked`.

## Unconfirmed

Partial selection is rendered as checked, not `aria-checked="mixed"`; the design has no partial-state frame. The nested layout has no standalone design frame (it appears only inside the permission matrix). Confirm both at the first nested consumer.

Test leaf-only values, select-all and parent toggling, `emptyMeansAll` round trip, and the accessible name actually changed.
