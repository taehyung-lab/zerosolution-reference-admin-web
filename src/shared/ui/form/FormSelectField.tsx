import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import { FormField, type FieldForm } from './FormField'
import { AsyncFieldBoundary, type AsyncFieldState } from '../feedback/AsyncFieldBoundary'
import { Select } from '../primitives/Select'

const noop = () => undefined

/**
 * Server-backed options arrive asynchronously; `state`/`onRetry` render the loading and error
 * states in place of the control (same surface as the list filters) and the caller decides the
 * state. `onValueChange` lets the caller react to the user's choice — clearing dependent fields,
 * for example — without a second subscription; the form value is committed first.
 */
export function FormSelectField<TValues, TName extends DeepKeysOfType<TValues, string>>({
  name,
  form,
  label,
  options,
  placeholder,
  required,
  description,
  disabled,
  state = 'ready',
  onRetry = noop,
  onValueChange,
}: {
  readonly name: TName
  readonly form: FieldForm<TValues>
  readonly label: string
  readonly options: readonly { value: string; label: string }[]
  readonly placeholder?: string
  readonly required?: boolean
  readonly description?: string
  readonly disabled?: boolean
  readonly state?: AsyncFieldState
  readonly onRetry?: () => void
  readonly onValueChange?: (value: string) => void
}) {
  return (
    <FormField form={form} name={name} label={label} required={required} description={description}>
      {(field, control, labelId) => (
        <AsyncFieldBoundary state={state} labelledBy={labelId} onRetry={onRetry}>
          <Select
            {...control}
            aria-labelledby={labelId}
            name={field.name}
            disabled={disabled}
            value={typeof field.state.value === 'string' && field.state.value !== '' ? field.state.value : null}
            onValueChange={(next) => {
              const value = next ?? ''
              field.handleChange(value as DeepValue<TValues, TName>)
              onValueChange?.(value)
            }}
            onBlur={field.handleBlur}
            options={options}
            placeholder={placeholder}
          />
        </AsyncFieldBoundary>
      )}
    </FormField>
  )
}
