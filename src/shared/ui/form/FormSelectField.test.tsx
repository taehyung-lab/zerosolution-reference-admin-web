import { fireEvent, render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { describe, expect, it, vi } from 'vitest'
import { chooseOptionIn } from '@/test/select'
import { TestLocaleProvider } from '@/test/locale'
import { FormSelectField } from './FormSelectField'

interface Values { readonly grade: string }

const options = [{ value: '1', label: '일반관리자' }, { value: '2', label: '슈퍼관리자' }]

function Harness({
  onSubmit,
  error,
  ...rest
}: {
  readonly onSubmit?: (values: Values) => void
  readonly error?: string
} & Partial<Pick<Parameters<typeof FormSelectField<Values, 'grade'>>[0], 'state' | 'onRetry' | 'onValueChange'>>) {
  const form = useForm({ defaultValues: { grade: '' } satisfies Values })
  return (
    <TestLocaleProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (error !== undefined) form.setFieldMeta('grade', (previous) => ({ ...previous, errorMap: { ...previous?.errorMap, onServer: error } }))
          onSubmit?.(form.state.values)
        }}
      >
        <FormSelectField form={form} label="권한" name="grade" options={options} placeholder="선택" required {...rest} />
        <button type="submit">저장</button>
      </form>
    </TestLocaleProvider>
  )
}

describe('FormSelectField', () => {
  it('names the composite control through FormField and renders the caller placeholder', () => {
    render(<Harness />)
    const trigger = screen.getByRole('combobox', { name: /^권한/ })
    expect(trigger).toHaveTextContent('선택')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAccessibleName('권한')
    expect(trigger.getAttribute('aria-labelledby')?.split(' ')).not.toContain(trigger.id)
  })
  it('commits the selected option to the form value, then tells the caller', async () => {
    const onSubmit = vi.fn()
    const onValueChange = vi.fn()
    render(<Harness onSubmit={onSubmit} onValueChange={onValueChange} />)
    await chooseOptionIn(/^권한/, '슈퍼관리자')
    expect(onValueChange).toHaveBeenCalledWith('2')
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSubmit).toHaveBeenCalledWith({ grade: '2' })
  })
  it('renders its own error from field state without the caller passing a message', () => {
    render(<Harness error="권한을 선택하세요." />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    const trigger = screen.getByRole('combobox', { name: /^권한/ })
    expect(screen.getByRole('alert')).toHaveTextContent('권한을 선택하세요.')
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('aria-describedby')
  })
  it('shows the option load state in place of the control and lets the user retry', () => {
    const onRetry = vi.fn()
    const { rerender } = render(<Harness state="loading" />)
    expect(screen.getByRole('status')).toHaveTextContent('옵션을 불러오는 중입니다.')
    expect(screen.queryByRole('combobox')).toBeNull()

    rerender(<Harness state="error" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('옵션을 불러오지 못했습니다.')
    fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
