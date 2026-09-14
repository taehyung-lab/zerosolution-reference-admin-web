# Radio group

Read this file only for `RadioGroup`/`RadioGroupItem`, `FormRadioGroupField`, or the preset row of `PeriodField`.

## Which control

- Mutually exclusive choices all visible at once (period presets, a recipient-type choice on a send form): `RadioGroup`.
- More than a handful of choices, or a value the design shows as a dropdown: `Select`.

## Data the caller passes

```tsx
<RadioGroup value={preset} onValueChange={setPreset} label={t('filters.periodPreset')}>
  {presets.map((p) => <RadioGroupItem key={p.value} value={p.value}>{p.label}</RadioGroupItem>)}
</RadioGroup>
```

- `value` is one string; an item is checked only when its `value` equals it, so `''` (what `FormRadioGroupField` passes for an empty form value) renders no checked item. A filter row always passes a real preset; a form may start empty and validate `required` in its schema.
- `RadioGroupItem` children are the translated visible label; `value` strings are caller vocabulary, never interpreted here.
- The native `name` is generated internally; a form adapter (`FormRadioGroupField`) binds `value`/`onValueChange` and passes `labelId`.

## Accessibility

The group is a `fieldset`. Name it **either** with `label` (rendered as a visually hidden `legend`) **or** with `ariaLabelledby` pointing at an existing label — never both, or the name is announced twice. Inside `PeriodFilterField` the row group is named by the filter label, so pass `presetGroupLabel` to `PeriodField` (it becomes the radio group's `label`) to give the preset radios their own distinct name.

Test the single-value transition, keyboard arrow movement between items, and the one naming path actually used.
