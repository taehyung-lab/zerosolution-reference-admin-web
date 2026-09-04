import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import { FormField, type FieldForm } from './FormField'
import { RadioGroup, RadioGroupItem } from '../primitives/RadioGroup'

export function FormRadioGroupField<TValues, TName extends DeepKeysOfType<TValues, string>>({ form, name, label, options, required, description }: { readonly form: FieldForm<TValues>; readonly name: TName; readonly label: string; readonly options: readonly { value: string; label: string }[]; readonly required?: boolean; readonly description?: string }) {
  return <FormField form={form} name={name} label={label} required={required} description={description}>{(field, control, labelId) => <RadioGroup id={control.id} ariaDescribedby={control['aria-describedby']} ariaInvalid={control['aria-invalid']} ariaLabelledby={labelId} value={typeof field.state.value === 'string' ? field.state.value : ''} onValueChange={(value) => field.handleChange(value as DeepValue<TValues, TName>)} onBlur={field.handleBlur}>{options.map((option) => <RadioGroupItem key={option.value} value={option.value}>{option.label}</RadioGroupItem>)}</RadioGroup>}</FormField>
}
