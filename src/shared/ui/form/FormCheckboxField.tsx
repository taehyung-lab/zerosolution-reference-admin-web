import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import { FormField, type FieldForm } from './FormField'
import { Checkbox } from '../primitives/Checkbox'

export function FormCheckboxField<TValues, TName extends DeepKeysOfType<TValues, boolean>>({ form, name, label, description, disabled }: { readonly form: FieldForm<TValues>; readonly name: TName; readonly label: string; readonly description?: string; readonly disabled?: boolean }) {
  return <FormField form={form} name={name} label={label} description={description}>{(field, control) => <Checkbox {...control} checked={field.state.value === true} disabled={disabled} name={field.name} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.checked as DeepValue<TValues, TName>)} />}</FormField>
}
