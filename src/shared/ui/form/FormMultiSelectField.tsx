import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import { FormField, type FieldForm } from './FormField'
import { MultiSelect } from '../primitives/MultiSelect'

export function FormMultiSelectField<TValues, TName extends DeepKeysOfType<TValues, string[]>>({ form, name, label, options, getRemoveLabel, required, description }: { readonly form: FieldForm<TValues>; readonly name: TName; readonly label: string; readonly options: readonly { value: string; label: string }[]; readonly getRemoveLabel: (option: { value: string; label: string }) => string; readonly required?: boolean; readonly description?: string }) {
  return <FormField form={form} name={name} label={label} required={required} description={description}>{(field, control, labelId) => <MultiSelect id={control.id} ariaDescribedby={control['aria-describedby']} ariaInvalid={control['aria-invalid']} ariaLabelledby={labelId} values={Array.isArray(field.state.value) ? field.state.value as string[] : []} onValueChange={(value) => field.handleChange(value as DeepValue<TValues, TName>)} onBlur={field.handleBlur} options={options} getRemoveLabel={getRemoveLabel} />}</FormField>
}
