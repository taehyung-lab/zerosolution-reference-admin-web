import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { AppProviders, createQueryClient } from '@/app/providers/AppProviders'
import { clearAccessToken, setAccessToken } from '@/api/http/credential'
import { i18n } from '@/shared/i18n/i18n'
import { AppRouterProvider, createAppRouter } from './router'

function renderAt(path: string) {
  const queryClient = createQueryClient()
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return {
    queryClient,
    router,
    rendered: render(
      <AppProviders queryClient={queryClient}>
        <AppRouterProvider router={router} />
      </AppProviders>,
    ),
  }
}

afterEach(() => { clearAccessToken() })

describe('router 진입', () => {
  it('저장된 토큰이 없으면 앱 화면 대신 로그인으로 보낸다', async () => {
    const { router } = renderAt('/managers')

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toEqual({ redirect: '/managers' })
  })

  it('로그인 뒤 돌아갈 경로에 원래 검색값을 보존한다', async () => {
    const { router } = renderAt('/managers?periodType=UPDATED_AT')

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toEqual({
      redirect: '/managers?periodType=UPDATED_AT',
    })
  })

  it('저장된 토큰이 있으면 앱 화면으로 들어간다', async () => {
    setAccessToken('token-1')

    const { router } = renderAt('/managers')

    await waitFor(() => expect(router.state.location.pathname).toBe('/managers'))
  })

  it('route loader가 같은 QueryClient를 읽을 수 있는 context를 가진다', async () => {
    const { queryClient, router } = renderAt('/')
    expect(router.options.context.queryClient).toBe(queryClient)
    expect(router.options.context.locale).toBe('ko')
    expect(
      await screen.findByRole('heading', { name: i18n.t('bootstrap.title', { ns: 'app' }) }),
    ).toBeInTheDocument()
  })

  it('없는 경로는 not-found를 렌더한다', async () => {
    renderAt('/definitely-not-a-route')
    expect(await screen.findByText('페이지를 찾을 수 없습니다.')).toBeInTheDocument()
  })

  it('LocaleProvider의 현재 locale을 같은 Router context에 갱신한다', async () => {
    setAccessToken('token-1')
    const { router } = renderAt('/managers')
    const locale = await screen.findByRole('combobox', { name: '언어' })

    fireEvent.change(locale, { target: { value: 'ja' } })

    await waitFor(() => expect(router.options.context.locale).toBe('ja'))
  })

  it('역전된 Manager 기간만 URL에서 제거하고 다른 정상 검색값은 보존한다', async () => {
    setAccessToken('token-1')
    const { router } = renderAt(
      '/managers?startDateTime=2026-09-01T00%3A00%3A00.000Z&endDateTime=2026-08-31T23%3A59%3A59.999Z&periodType=UPDATED_AT&sortDirection=ASC',
    )

    await waitFor(() =>
      expect(router.state.location.href).toBe(
        '/managers?periodType=UPDATED_AT&sortDirection=ASC',
      ),
    )
    expect(router.state.location.search).toEqual({
      periodType: 'UPDATED_AT',
      sortDirection: 'ASC',
    })
  })
})
