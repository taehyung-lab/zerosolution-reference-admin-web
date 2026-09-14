import { fireEvent, render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'
import { FormArrayField } from './FormArrayField'

type Values = { rows: { id: string; name: string }[] }

function ArrayHarness({ minItems }: { readonly minItems?: number }) {
  const form = useForm({
    defaultValues: { rows: [{ id: 'a', name: 'A' }] } satisfies Values,
  })

  return (
    <FormArrayField form={form} name="rows" minItems={minItems}>
      {({ items, append, prepend, insert, remove, move, canRemove }) => (
        <div>
          <output>{items.map((item) => item.id).join(',')}</output>
          <output aria-label="can remove">{String(canRemove)}</output>
          <button type="button" onClick={() => append({ id: 'd', name: 'D' })}>append</button>
          <button type="button" onClick={() => prepend({ id: 'z', name: 'Z' })}>prepend</button>
          <button type="button" onClick={() => insert(1, { id: 'b', name: 'B' })}>insert</button>
          <button type="button" onClick={() => move(0, items.length - 1)}>move</button>
          <button type="button" onClick={() => remove(0)}>remove</button>
        </div>
      )}
    </FormArrayField>
  )
}

describe('FormArrayField', () => {
  it('defaults minItems to zero and permits removing the last row', () => {
    render(<ArrayHarness />)

    expect(screen.getByLabelText('can remove')).toHaveTextContent('true')
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(screen.getByText('', { selector: 'output:not([aria-label])' })).toBeInTheDocument()
  })

  it('hides the remove capability and refuses removal at minItems', () => {
    render(<ArrayHarness minItems={1} />)

    expect(screen.getByLabelText('can remove')).toHaveTextContent('false')
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(screen.getByText('a', { selector: 'output:not([aria-label])' })).toBeInTheDocument()
  })

  it('exposes prepend, insert, append, and move against the registered array path', () => {
    render(<ArrayHarness minItems={1} />)

    fireEvent.click(screen.getByRole('button', { name: 'append' }))
    fireEvent.click(screen.getByRole('button', { name: 'prepend' }))
    fireEvent.click(screen.getByRole('button', { name: 'insert' }))
    expect(screen.getByText('z,b,a,d')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'move' }))
    expect(screen.getByText('b,a,d,z')).toBeInTheDocument()
  })
})
