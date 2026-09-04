import { fireEvent, render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'
import { FormFileField, type FormFileValue } from './FormFileField'

function Harness() {
  const form = useForm({ defaultValues: { attachment: { kind: 'empty' } as FormFileValue } })
  return <FormFileField form={form} name="attachment" label="Attachment" selectLabel="Select file" removeLabel="Remove file" />
}

describe('FormFileField', () => {
  it('owns only single-file selection and removal state', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Select file')
    const file = new File(['content'], 'ticket.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText('ticket.txt')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove file' }))
    expect(screen.queryByText('ticket.txt')).not.toBeInTheDocument()
  })
})
