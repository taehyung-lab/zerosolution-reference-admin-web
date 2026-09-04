import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import { useId, type ComponentProps } from 'react'
import { FormField, type FieldForm } from './FormField'
import { Input } from '../primitives/Input'

type InputProps = Omit<ComponentProps<'input'>, 'form' | 'name' | 'id' | 'value' | 'onChange' | 'onBlur' | 'ref'>
type EditableProps<TValues, TName extends DeepKeysOfType<TValues, string>> = InputProps & {
  readonly readOnly?: false
  readonly name: TName
  readonly form: FieldForm<TValues>
  readonly label: string
  readonly required?: boolean
  readonly description?: string
}
type StaticProps = { readonly readOnly: true; readonly label: string; readonly value: string; readonly required?: never }

export function FormTextField(props: StaticProps): React.JSX.Element
export function FormTextField<TValues, TName extends DeepKeysOfType<TValues, string>>(props: EditableProps<TValues, TName>): React.JSX.Element
export function FormTextField<TValues, TName extends DeepKeysOfType<TValues, string>>(props: StaticProps | EditableProps<TValues, TName>) {
  const staticLabelId = useId()
  if (props.readOnly) {
    return <div className="space-y-2"><span className="block text-sm font-medium text-neutral-800" id={staticLabelId}>{props.label}</span><p aria-labelledby={staticLabelId} className="min-h-10 py-2 text-sm">{props.value}</p></div>
  }
  const { name, form, label, required, description, ...inputProps } = props
  return (
    <FormField form={form} name={name} label={label} required={required} description={description}>
      {(field, control) => <Input {...control} {...inputProps} name={field.name} value={typeof field.state.value === 'string' ? field.state.value : ''} onChange={(event) => field.handleChange(event.target.value as DeepValue<TValues, TName>)} onBlur={field.handleBlur} />}
    </FormField>
  )
}
