# Select

Read this file only for single-selection `Select` or `FormSelectField` behavior.

- Public value is one ID or `null`; do not use an empty-string item value.
- Radix empty-string mapping remains inside the primitive. Callers never see it.
- The control is fully controlled and receives caller-owned options, placeholder, disabled state, visible labels, and callbacks.
- Option meaning, defaults, Query, mapping, validation, copy, and payload stay with the feature.
- Do not add `searchable`, `multiple`, or domain `mode` switches; Combobox and MultiSelect have separate contracts.
- `Select({ value: string | null, onValueChange(value | null), options: { value, label }[], placeholder?, disabled?, className?, id?, name?, onBlur?, ref?, 'aria-label' | 'aria-labelledby', 'aria-describedby'?, 'aria-invalid'? })`. Name it by exactly one path: `aria-label` when it sits inside an already-named group (filter row slots), `aria-labelledby` when a visible label exists.

Read [form-fields.md](form-fields.md) only for the form adapter and [primitives-and-tokens.md](primitives-and-tokens.md) only when primitive focus, keyboard, token, or Radix wiring changes. Test the controlled null/value transition and accessible selection behavior changed.
