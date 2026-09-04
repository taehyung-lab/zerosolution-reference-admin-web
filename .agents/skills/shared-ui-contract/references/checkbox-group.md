# Checkbox group and tree

Read this file only for a "전체 | 개별" multi-select filter group, a nested checkbox tree, or `CheckboxTree` rendering. Dropdown-style multi-selection is [multiselect.md](multiselect.md); a permission matrix is [form-fields.md](form-fields.md).

## Which control

- Options are few, all visible at once, and the product shows them inline with a leading 전체 — `CheckboxTree` (every list filter group in the inventory: 가입방법, 계정 상태, 예매처, 유형…).
- Options are many, searched, or shown as removable tokens — `MultiSelect`.
- Rows × function columns with per-column select-all — a feature composition of `Table` + `Checkbox`; `CheckboxTree` supplies only the row-hierarchy algebra.

## Data the caller passes

`nodes` is one shape for every depth; the control decides nothing from a `mode`.

```ts
// flat (one level): every node is a leaf
[{ value: 'WEB', label: 'WEB' }, { value: 'APP', label: 'APP' }]

// nested (two or more levels): a branch has `label` + `children` and no `value`
[{ label: '활성회원', children: [{ value: 'NORMAL', label: '일반회원' }, { value: 'BAD', label: '불량회원' }] },
 { label: '비활성회원', children: [{ value: 'DORMANT', label: '휴면회원' }, { value: 'WITHDRAWN', label: '탈퇴회원' }] }]
```

- `values` and `onValueChange` carry **leaf values only**. A branch is never a value; its checked state is derived (checked when any descendant is selected), and clicking it selects or clears every descendant.
- The leading 전체 control is checked only when every leaf is selected; clicking it selects or clears all leaves.
- `emptyMeansAll` maps "everything selected" to `[]`. Use it when the server treats an omitted filter as no restriction, so the canonical URL and request omit the array (list-workflow: omit empty arrays). Without it, `[]` means nothing selected.
- Labels are already translated strings; server enum meaning, option source, and the default stay with the feature. Async options render inside `AsyncFieldBoundary` with the feature-decided state.
- A flat group renders inline (전체 | a b c) as the design shows; a nested group renders an indented list. Nesting depth is not limited.

## Accessibility

`CheckboxTree` names itself: pass `FilterField`'s `labelId` as `ariaLabelledby` and do **not** use `FilterField group` around it, or the name is announced twice. Each item is `role="checkbox"` with `aria-checked`.

## Unconfirmed

Partial selection is rendered as checked, not `aria-checked="mixed"`; the design has no partial-state frame. The nested layout has no standalone design frame (it appears only inside the permission matrix). Confirm both at the first nested consumer.

Test leaf-only values, select-all and parent toggling, `emptyMeansAll` round trip, and the accessible name actually changed.
