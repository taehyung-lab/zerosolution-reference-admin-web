import type { DeepKeysOfType, DeepValue } from '@tanstack/react-form'
import type { ReactNode } from 'react'
import type { FieldForm } from './FormField'

type ArrayItem<TValues, TName extends DeepKeysOfType<TValues, unknown[]>> =
  DeepValue<TValues, TName> extends (infer TItem)[] ? TItem : never

export interface FormArrayFieldApi<TItem> {
  readonly items: readonly TItem[]
  readonly errors: readonly unknown[]
  readonly canRemove: boolean
  readonly append: (value: TItem) => void
  readonly prepend: (value: TItem) => void
  readonly insert: (index: number, value: TItem) => void
  readonly remove: (index: number) => void
  readonly move: (from: number, to: number) => void
}

export function FormArrayField<
  TValues,
  const TName extends DeepKeysOfType<TValues, unknown[]>,
>({
  form,
  name,
  minItems = 0,
  children,
}: {
  readonly form: FieldForm<TValues>
  readonly name: TName
  readonly minItems?: number
  readonly children: (field: FormArrayFieldApi<ArrayItem<TValues, TName>>) => ReactNode
}) {
  if (!Number.isInteger(minItems) || minItems < 0) {
    throw new RangeError('FormArrayField minItems must be a non-negative integer')
  }

  return (
    <form.Field name={name} mode="array">
      {(field) => {
        const items = field.state.value as ArrayItem<TValues, TName>[]
        const canRemove = items.length > minItems

        return children({
          items,
          errors: field.state.meta.errors,
          canRemove,
          append: (value) => field.pushValue(value),
          prepend: (value) => field.insertValue(0, value),
          insert: (index, value) => field.insertValue(index, value),
          remove: (index) => {
            if (canRemove) field.removeValue(index)
          },
          move: (from, to) => field.moveValue(from, to),
        })
      }}
    </form.Field>
  )
}
