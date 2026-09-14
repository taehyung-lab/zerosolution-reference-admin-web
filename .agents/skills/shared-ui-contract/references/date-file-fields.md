# Date, time, file, and array fields

Read this file only for date/time/period controls, file-field values, or repeating form fields.

- Calendar presentation uses the selected date primitive. Date-only is `YYYY-MM-DD`, time-only is `HH:mm`, and an instant is ISO with an explicit offset or `Z`; form/API models do not store `Date` objects.
- A range is `{ from, to }` of the same value kind. `PeriodField` receives only adopted presets and generic labels. The feature owns period meaning, defaults, cross-field validation/copy, and request boundaries.
- UI constraints may use opposite bounds, but schema/URL validation remains feature-owned. Pure `datetime.ts` functions receive an explicit timezone; `usePeriodDraft` reads `displayTimeZone()` itself and owns the browser-day ↔ UTC-boundary conversion of the draft. The feature owns which request fields receive the result.
- A file value distinguishes `empty | existing | selected | removed`. Shared UI owns selection/removal presentation, not upload transport, storage type, progress, retry, or multiple-file policy.
- `FormArrayField` registers its real TanStack Form array path and provides guarded array operations. `minItems` defaults to `0`; a feature passes another minimum only when its schema requires one. Row semantics, item creation and stable IDs, max policy, and Zod validation remain feature concerns. `SortableList` stays form-independent and reports only `from`/`to` to the array owner.

- `Calendar({ value?: 'YYYY-MM-DD', min?, max?, onValueChange(value | undefined), id?, ariaLabelledby?, ariaDescribedby?, ariaInvalid?, onBlur? })` — it has no `label` prop; the caller names it with `ariaLabelledby`. `id` and the ARIA props land on its `role="group"` wrapper `div`, not on a focusable element, so a form adapter names it as a group (`FormField labelTarget="group"`) rather than with `<label htmlFor>`. Display locale and navigation labels come from the `shared` i18n namespace (a named exception to "primitives receive copy as props"). `FileInput` emits one `File | undefined`; `multiple` and a controlled `value` are out of contract.
- `PeriodField({ preset, presets: { value, label }[], customLabel, onPresetChange, range: { from?, to? }, onRangeChange, fromLabel, toLabel, calendarLabel, presetGroupLabel?, error? })` renders the adopted preset radios plus one range surface. Any manual date edit emits `onRangeChange`; switching the preset to `CUSTOM` is the caller's (`usePeriodDraft`) transition, not the field's.

Read [form-fields.md](form-fields.md) for adapters and [file-workflow.md](../../feature-contract/references/file-workflow.md) for upload/download behavior. Test only the value kind, accessibility, boundary conversion, and interaction changed.
