import { fireEvent, render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'
import { FormTextField } from './FormTextField'

function EditableHarness() {
  const form = useForm({ defaultValues: { name: '' } })
  return <FormTextField form={form} label="Name" name="name" description="Help" />
}

describe('FormTextField', () => {
  it('binds editable text and its accessibility description', () => {
    render(<EditableHarness />)
    const input = screen.getByLabelText('Name')
    fireEvent.change(input, { target: { value: 'Kim' } })
    expect(input).toHaveValue('Kim')
    expect(input).toHaveAccessibleDescription('Help')
  })
  it('renders a static labelled value without registering an input or required marker', () => {
    render(<FormTextField readOnly label="ID" value="operator01" />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('operator01')).toHaveAccessibleName('ID')
    expect(screen.getByText('ID')).not.toHaveTextContent('*')
  })
})
