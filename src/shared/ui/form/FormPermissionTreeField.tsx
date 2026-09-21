import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import { FormField, type FieldForm } from './FormField'
import { CheckboxTree, type CheckboxTreeNode } from '../primitives/CheckboxTree'

export function FormPermissionTreeField<TValues, TName extends DeepKeysOfType<TValues, string[]>>({ form, name, label, nodes, emptyMeansAll, required, description }: { readonly form: FieldForm<TValues>; readonly name: TName; readonly label: string; readonly nodes: readonly CheckboxTreeNode[]; readonly emptyMeansAll?: boolean; readonly required?: boolean; readonly description?: string }) {
  return <FormField form={form} name={name} label={label} labelTarget="group" required={required} description={description}>{(field, control, labelId) => <CheckboxTree id={control.id} ariaDescribedby={control['aria-describedby']} ariaInvalid={control['aria-invalid']} ariaLabelledby={labelId} nodes={nodes} values={Array.isArray(field.state.value) ? field.state.value as string[] : []} onValueChange={(value) => field.handleChange(value as DeepValue<TValues, TName>)} onBlur={field.handleBlur} emptyMeansAll={emptyMeansAll} />}</FormField>
}
