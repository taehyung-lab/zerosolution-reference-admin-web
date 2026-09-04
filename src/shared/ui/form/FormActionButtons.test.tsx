import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TestLocaleProvider } from '@/test/locale'
import { FormCancelButton } from './FormCancelButton'
import { FormSubmitButton } from './FormSubmitButton'

describe('form action buttons', () => {
  it('fixes submit semantics and disables while pending', () => {
    render(<TestLocaleProvider><FormSubmitButton pending>Save</FormSubmitButton></TestLocaleProvider>)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
  it('keeps cancel as a plain caller-owned action', () => {
    const onClick = vi.fn()
    render(<TestLocaleProvider><FormCancelButton onClick={onClick}>Cancel</FormCancelButton></TestLocaleProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button')
  })
  it('renders the product-wide 저장/취소 labels when the caller passes none', () => {
    render(
      <TestLocaleProvider>
        <FormSubmitButton pending={false} />
        <FormCancelButton onClick={() => undefined} />
      </TestLocaleProvider>,
    )
    expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute('type', 'submit')
    expect(screen.getByRole('button', { name: '취소' })).toHaveAttribute('type', 'button')
  })
})
