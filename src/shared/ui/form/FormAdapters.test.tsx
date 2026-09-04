import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { FormCheckboxField } from './FormCheckboxField'
import { FormComboboxField } from './FormComboboxField'
import { FormDateField } from './FormDateField'
import { FormMultiSelectField } from './FormMultiSelectField'
import { FormPermissionTreeField } from './FormPermissionTreeField'
import { FormRadioGroupField } from './FormRadioGroupField'

function Harness() {
  const form = useForm({
    defaultValues: { tags: [] as string[], choice: '', enabled: false, radio: '', date: '', permissions: [] as string[] },
    validators: { onBlur: z.object({
      tags: z.array(z.string()).min(1, 'Choose tags'),
      choice: z.string().min(1, 'Choose one'),
      enabled: z.literal(true, 'Enable it'),
      radio: z.string().min(1, 'Choose radio'),
      date: z.string().min(1, 'Choose date'),
      permissions: z.array(z.string()).min(1, 'Choose permission'),
    }) },
  })
  return <>
    <FormMultiSelectField form={form} name="tags" label="Tags" description="Tag help" options={[{ value: 'a', label: 'A' }]} getRemoveLabel={() => 'Remove'} />
    <FormComboboxField form={form} name="choice" label="Choice" description="Choice help" options={[]} searchValue="" onSearchValueChange={() => undefined} placeholder="Choose" searchLabel="Search" emptyLabel="Empty" />
    <FormCheckboxField form={form} name="enabled" label="Enabled" description="Enabled help" />
    <FormRadioGroupField form={form} name="radio" label="Radio" description="Radio help" options={[{ value: 'a', label: 'A' }]} />
    <FormDateField form={form} name="date" label="Date" description="Date help" />
    <FormPermissionTreeField form={form} name="permissions" label="Permissions" description="Permission help" nodes={[{ value: 'read', label: 'Read' }]} selectAllLabel="All" />
  </>
}

describe('form adapters accessibility', () => {
  it('forwards label, description, invalid state, and blur validation to composite primitives', async () => {
    render(<Harness />)
    const controls = [
      screen.getByText('—'),
      screen.getByRole('button', { name: 'Choice' }),
      screen.getByLabelText('Enabled'),
      screen.getByRole('group', { name: 'Radio' }),
      screen.getByRole('group', { name: 'Date' }),
      screen.getByRole('group', { name: 'Permissions' }),
    ]
    controls.forEach((control) => fireEvent.blur(control))
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(6))
    for (const control of controls) {
      expect(control).toHaveAttribute('aria-invalid', 'true')
      expect(control).toHaveAttribute('aria-describedby')
    }
  })
})
