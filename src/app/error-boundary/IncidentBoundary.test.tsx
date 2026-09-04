import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocaleProvider } from '@/app/providers/LocaleProvider'
import { ApiError } from '@/api/error'
import {
  clearAccessToken,
  readCredentialGeneration,
  setAccessToken,
} from '@/api/http/credential'
import { publishIncident } from '@/api/http/incident'
import { IncidentBoundary } from './IncidentBoundary'

afterEach(() => { clearAccessToken() })

/** transport 의 발행 순서를 그대로 따른다: 세대를 먼저 읽고, 자격증명을 지우고, 사실을 발행한다. */
function publishTerminalUnauthorized(source: 'api' | 'refresh') {
  const credentialGeneration = readCredentialGeneration()
  clearAccessToken()
  publishIncident({ type: 'unauthorized', source, status: 401, credentialGeneration })
}

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

    act(() => publishTerminalUnauthorized('refresh'))

    expect(screen.getByText('child')).toBeInTheDocument()
    expect(onLoginRequired).toHaveBeenCalledOnce()
  })

  it('asks for login once while concurrent 401 incidents keep arriving', () => {
    const onLoginRequired = vi.fn()
    renderBoundary(
      <IncidentBoundary onLoginRequired={onLoginRequired} onGoBack={vi.fn()}>
        <span>child</span>
      </IncidentBoundary>,
    )

    setAccessToken('token-before-concurrent-401')
    act(() => {
      const credentialGeneration = readCredentialGeneration()
      clearAccessToken()
      publishIncident({ type: 'unauthorized', source: 'refresh', status: 401, credentialGeneration })
      publishIncident({ type: 'unauthorized', source: 'api', status: 401, credentialGeneration })
      publishIncident({ type: 'unauthorized', source: 'api', status: 401, credentialGeneration })
    })

    expect(onLoginRequired).toHaveBeenCalledOnce()
  })

  it('asks again for the second expiry once the user has signed back in', () => {
    const onLoginRequired = vi.fn()
    renderBoundary(
      <IncidentBoundary onLoginRequired={onLoginRequired} onGoBack={vi.fn()}>
        <span>child</span>
      </IncidentBoundary>,
    )

    setAccessToken('token-before-first-expiry')
    act(() => publishTerminalUnauthorized('refresh'))
    act(() => { setAccessToken('token-after-sign-in') })
    act(() => publishTerminalUnauthorized('refresh'))

    expect(onLoginRequired).toHaveBeenCalledTimes(2)
  })

  it('asks again for the next expiry when the new credential arrived from another tab', () => {
    /**
     * 다른 탭의 로그인은 이 문서에 storage 이벤트로만 도착한다. 그것도 새 자격증명이 성립한
     * 사실이므로 세대가 올라야 한다. 오르지 않으면 이 탭은 이전 세대의 억제에 갇혀
     * 다음 만료에서 로그인 요구를 영원히 삼킨다.
     */
    const onLoginRequired = vi.fn()
    renderBoundary(
      <IncidentBoundary onLoginRequired={onLoginRequired} onGoBack={vi.fn()}>
        <span>child</span>
      </IncidentBoundary>,
    )

    setAccessToken('token-before-first-expiry')
    act(() => publishTerminalUnauthorized('refresh'))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'accessToken',
        oldValue: null,
        newValue: 'token-stored-by-another-tab',
      }))
    })
    act(() => publishTerminalUnauthorized('api'))

    expect(onLoginRequired).toHaveBeenCalledTimes(2)
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
