import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocaleProvider } from '@/app/providers/LocaleProvider'
import { ApiError } from '@/api/error'
import { publishIncident } from '@/api/http/incident'
import { IncidentBoundary } from './IncidentBoundary'

describe('IncidentBoundary', () => {
  const renderBoundary = (node: React.ReactNode) => render(
    <QueryClientProvider client={new QueryClient()}><LocaleProvider>{node}</LocaleProvider></QueryClientProvider>,
  )

  it('owns terminal unauthorized state and sends the user to login', () => {
    const onLoginRequired = vi.fn()
    renderBoundary(
      <IncidentBoundary onLoginRequired={onLoginRequired} onGoBack={vi.fn()}>
        <span>child</span>
      </IncidentBoundary>,
    )

    act(() => publishIncident({ type: 'unauthorized', source: 'refresh', status: 401 }))

    expect(screen.getByText('child')).toBeInTheDocument()
    expect(onLoginRequired).toHaveBeenCalledOnce()
  })

  it('shows the confirmed access modal and moves back only after acknowledgement', async () => {
    const onGoBack = vi.fn()
    renderBoundary(
      <IncidentBoundary onLoginRequired={vi.fn()} onGoBack={onGoBack}>
        <span>child</span>
      </IncidentBoundary>,
    )

    act(() => publishIncident({ type: 'forbidden', status: 403 }))

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('접근권한이 없습니다. 이전 화면으로 이동하세요.'))
    expect(onGoBack).not.toHaveBeenCalled()
    screen.getByRole('button', { name: '이전 화면으로 이동' }).click()
    expect(onGoBack).toHaveBeenCalledOnce()
  })

  it('ignores a forbidden error from an observerless prefetch', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}><LocaleProvider>
        <IncidentBoundary onLoginRequired={vi.fn()} onGoBack={vi.fn()}><span>child</span></IncidentBoundary>
      </LocaleProvider></QueryClientProvider>,
    )
    const error = new ApiError({ kind: 'forbidden', message: 'raw', status: 403 })

    await queryClient.query({
      queryKey: ['prefetch-forbidden'],
      queryFn: () => {
        publishIncident({ type: 'forbidden', status: 403, error })
        return Promise.reject(error)
      },
    }).catch(() => undefined)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
