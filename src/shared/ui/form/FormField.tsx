import type { DeepKeys, DeepValue, FieldComponent, Updater } from '@tanstack/react-form'
import type { ReactNode } from 'react'

export type FieldForm<TValues> = {
  readonly formId: string
  // Validator parameters are intentionally erased here; `DeepKeys<TValues>` still owns the public name contract.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Field: FieldComponent<TValues, any, any, any, any, any, any, any, any, any, any, any>
}

export interface FieldControlProps {
  readonly id: string
  readonly 'aria-describedby'?: string
  readonly 'aria-invalid': boolean
}

export function formFieldControlId<TValues>(form: Pick<FieldForm<TValues>, 'formId'>, name: DeepKeys<TValues>): string {
  return `form-${form.formId}-field-${encodeURIComponent(name)}`
}

type FieldValueApi<TValues, TName extends DeepKeys<TValues>> = {
  readonly name: TName
  readonly state: { readonly value: DeepValue<TValues, TName>; readonly meta: { readonly errors: readonly unknown[] } }
  readonly handleChange: (value: Updater<DeepValue<TValues, TName>>) => void
  readonly handleBlur: () => void
}

interface FormFieldProps<TValues, TName extends DeepKeys<TValues>> {
  readonly form: FieldForm<TValues>
  readonly name: TName
  readonly label: string
  readonly required?: boolean
  readonly description?: string
  /**
   * `control` (default) renders `<label htmlFor={control.id}>`, so the adapter must put
   * `control.id` on one labelable element. `group` renders the label as `<span id={labelId}>`
   * for a composite the adapter names itself with `role="group" aria-labelledby={labelId}`;
   * a `label[for]` aimed at a wrapper would name nothing and move focus nowhere.
   */
  readonly labelTarget?: 'control' | 'group'
  readonly children: (field: FieldValueApi<TValues, TName>, control: FieldControlProps, labelId: string) => ReactNode
}

function errorMessage(error: unknown): string | undefined {
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return undefined
}

export function FormField<TValues, const TName extends DeepKeys<TValues>>({ form, name, label, required = false, description, labelTarget = 'control', children }: FormFieldProps<TValues, TName>) {
  const inputId = formFieldControlId<TValues>(form, name)
  const labelId = `${inputId}-label`
  const descriptionId = description === undefined ? undefined : `${inputId}-description`

  return (
    <form.Field name={name}>
      {(field) => {
        const error = field.state.meta.errors.map(errorMessage).find((message) => message !== undefined)
        const errorId = error === undefined ? undefined : `${inputId}-error`
        const describedBy = [descriptionId, errorId].filter((id): id is string => id !== undefined).join(' ')
        const labelText = <>{label}{required ? <span aria-hidden="true">*</span> : null}</>
        const labelClassName = 'block text-sm font-medium text-neutral-800'
        return (
          <div className="space-y-2">
            {labelTarget === 'group'
              ? <span className={labelClassName} id={labelId}>{labelText}</span>
              : <label className={labelClassName} htmlFor={inputId} id={labelId}>{labelText}</label>}
            {children(field, {
              id: inputId,
              'aria-describedby': describedBy === '' ? undefined : describedBy,
              'aria-invalid': error !== undefined,
            }, labelId)}
            {description === undefined ? null : <p id={descriptionId} className="text-xs text-neutral-600">{description}</p>}
            {error === undefined ? null : <p id={errorId} role="alert" className="text-xs text-red-700">{error}</p>}
          </div>
        )
      }}
    </form.Field>
  )
}
