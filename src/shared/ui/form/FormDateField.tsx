import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import { FormField, type FieldForm } from './FormField'
import { Calendar } from '../primitives/Calendar'

export function FormDateField<TValues, TName extends DeepKeysOfType<TValues, string>>({ form, name, label, min, max, required, description }: { readonly form: FieldForm<TValues>; readonly name: TName; readonly label: string; readonly min?: string; readonly max?: string; readonly required?: boolean; readonly description?: string }) {
  return <FormField form={form} name={name} label={label} required={required} description={description} labelTarget="group">{(field, control, labelId) => <Calendar id={control.id} ariaDescribedby={control['aria-describedby']} ariaInvalid={control['aria-invalid']} ariaLabelledby={labelId} value={typeof field.state.value === 'string' && field.state.value !== '' ? field.state.value : undefined} min={min} max={max} onValueChange={(value) => field.handleChange((value ?? '') as DeepValue<TValues, TName>)} onBlur={field.handleBlur} />}</FormField>
}
