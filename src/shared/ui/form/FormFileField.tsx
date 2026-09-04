import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import { FormField, type FieldForm } from './FormField'
import { FileInput } from '../primitives/FileInput'
import { Button } from '../primitives/Button'

export type FormFileValue = { readonly kind: 'empty' } | { readonly kind: 'existing'; readonly name: string } | { readonly kind: 'selected'; readonly file: File } | { readonly kind: 'removed' }

export function FormFileField<TValues, TName extends DeepKeysOfType<TValues, FormFileValue>>({ form, name, label, selectLabel, removeLabel, accept, description, required }: { readonly form: FieldForm<TValues>; readonly name: TName; readonly label: string; readonly selectLabel: string; readonly removeLabel: string; readonly accept?: string; readonly description?: string; readonly required?: boolean }) {
  return <FormField form={form} name={name} label={label} required={required} description={description}>{(field, control) => {
    const value = field.state.value as FormFileValue
    const fileName = value.kind === 'selected' ? value.file.name : value.kind === 'existing' ? value.name : undefined
    return <div><FileInput {...control} accept={accept} aria-label={selectLabel} onBlur={field.handleBlur} onFileChange={(file) => field.handleChange((file === undefined ? { kind: 'empty' } : { kind: 'selected', file }) as DeepValue<TValues, TName>)} />{fileName === undefined ? null : <div className="mt-2 flex items-center gap-2"><span>{fileName}</span><Button type="button" onClick={() => field.handleChange({ kind: 'removed' } as DeepValue<TValues, TName>)}>{removeLabel}</Button></div>}</div>
  }}</FormField>
}
