import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/app/providers/LocaleProvider'
import { ApiError } from '@/api/error'
import { RootErrorComponent, Route } from './__root'

describe('RootErrorComponent', () => {
  it('root route의 errorComponent로 연결된다', () => {
    expect(Route.options.errorComponent).toBe(RootErrorComponent)
  })

  it('서버 원문 없이 일반 문구와 재시도를 제공한다', () => {
    const reset = vi.fn()
    render(
      <LocaleProvider>
        <RootErrorComponent error={new Error('private server message')} reset={reset} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { name: '문제가 발생했습니다' })).toBeInTheDocument()
    expect(screen.queryByText('private server message')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('ApiError의 안전 문구와 trace metadata만 표시한다', () => {
    render(
      <LocaleProvider>
        <RootErrorComponent
          error={new ApiError({ kind: 'contract', message: 'raw server contract', status: 200, requestId: 'req-root' })}
          reset={vi.fn()}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('alert')).not.toHaveTextContent('raw server contract')
    expect(screen.getAllByText('req-root')).toHaveLength(2)
    expect(screen.getByText('contract')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })
})
