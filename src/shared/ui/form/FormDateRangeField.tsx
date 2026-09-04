import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import { FormField, type FieldForm } from './FormField'
import { Calendar } from '../primitives/Calendar'

export interface FormDateRangeValue { readonly from: string; readonly to: string }

export function FormDateRangeField<TValues, TName extends DeepKeysOfType<TValues, FormDateRangeValue>>({ form, name, label, fromLabel, toLabel, min, max, required, description }: { readonly form: FieldForm<TValues>; readonly name: TName; readonly label: string; readonly fromLabel: string; readonly toLabel: string; readonly min?: string; readonly max?: string; readonly required?: boolean; readonly description?: string }) {
  return <FormField form={form} name={name} label={label} required={required} description={description} labelTarget="group">{(field, control, labelId) => {
    const value = field.state.value as FormDateRangeValue
    const change = (next: FormDateRangeValue) => field.handleChange(next as DeepValue<TValues, TName>)
    return <div aria-describedby={control['aria-describedby']} aria-invalid={control['aria-invalid']} aria-labelledby={labelId} className="grid gap-4 md:grid-cols-2" id={control.id} role="group"><div><span id={`${control.id}-from-label`}>{fromLabel}</span><Calendar ariaLabelledby={`${control.id}-from-label`} value={value.from || undefined} min={min} max={value.to || max} onValueChange={(from) => change({ ...value, from: from ?? '' })} onBlur={field.handleBlur} /></div><div><span id={`${control.id}-to-label`}>{toLabel}</span><Calendar ariaLabelledby={`${control.id}-to-label`} value={value.to || undefined} min={value.from || min} max={max} onValueChange={(to) => change({ ...value, to: to ?? '' })} onBlur={field.handleBlur} /></div></div>
  }}</FormField>
}
