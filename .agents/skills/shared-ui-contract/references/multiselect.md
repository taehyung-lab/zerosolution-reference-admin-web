# MultiSelect

Read this file only for dropdown multi-selection (`MultiSelect`, `FormMultiSelectField`); an inline "전체 | 개별" checkbox group is [checkbox-group.md](checkbox-group.md).

- Current contract: `MultiSelect({ values: string[], onValueChange, options: { value, label }[], getRemoveLabel(option), id?, aria*, onBlur? })`. Public value is an ID array; the trigger shows the first resolved label plus `+N`; each selected option renders a removable token whose accessible name comes from `getRemoveLabel`.
- Selected items are rendered from the **same** `options` list: an ID that is not in `options` is kept in `values` but is not shown. Keeping a separate selected-item registry so labels survive search/pagination, and an "unavailable" label for unresolved IDs, are **unimplemented candidates** for the first searchable multi-select consumer.
- When nothing resolves, the trigger renders a hard-coded `—`; there is no caller prop for that text yet (candidate when a consumer needs product copy).
- Do not combine with single selection through a `multiple` switch. Caller owns options, mapping, limits, and payload semantics.

Read [form-fields.md](form-fields.md) for `FormMultiSelectField`. Test token removal names, the values transition, and keyboard operation actually changed.
