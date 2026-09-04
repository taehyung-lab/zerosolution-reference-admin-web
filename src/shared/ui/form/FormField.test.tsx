import { fireEvent, render, screen } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { FormField } from './FormField'

function Harness() {
  const form = useForm({
    defaultValues: { id: '' },
    validators: { onSubmit: z.object({ id: z.string().min(1, '필수 입력 항목입니다.') }) },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FormField form={form} label="아이디" name="id" required>
        {(field, control) => (
          <input
            {...control}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      </FormField>
      <button type="submit">저장</button>
      <button
        type="button"
        onClick={() => {
          form.setFieldMeta('id', (previous) => ({
            ...previous,
            errorMap: { ...previous?.errorMap, onServer: '서버가 거부했습니다.' },
          }))
        }}
      >
        서버 오류
      </button>
    </form>
  )
}

describe('FormField', () => {
  it('normalizes a Zod issue and connects the field ARIA contract', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    const input = screen.getByLabelText('아이디*')
    expect(await screen.findByRole('alert')).toHaveTextContent('필수 입력 항목입니다.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('renders a server string error through the same ARIA contract', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: '서버 오류' }))

    const input = screen.getByLabelText('아이디*')
    expect(await screen.findByRole('alert')).toHaveTextContent('서버가 거부했습니다.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
