import { render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'
import { FormDateRangeField } from './FormDateRangeField'

function Harness() {
  const form = useForm({ defaultValues: { period: { from: '', to: '' } } })
  return <FormDateRangeField form={form} name="period" label="Period" fromLabel="Start" toLabel="End" />
}

describe('FormDateRangeField', () => {
  it('labels the two date-only boundaries without adopting list PeriodField behavior', () => {
    render(<Harness />)
    expect(screen.getByRole('group', { name: 'Start' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'End' })).toBeInTheDocument()
  })
  it('names the range as one group instead of pointing a label at a non-labelable wrapper', () => {
    render(<Harness />)
    expect(screen.getByRole('group', { name: 'Period' })).toBeInTheDocument()
    for (const label of document.querySelectorAll('label[for]')) {
      expect((label as HTMLLabelElement).control, `label[for=${label.getAttribute('for')}] must target a labelable control`).not.toBeNull()
    }
  })
})
