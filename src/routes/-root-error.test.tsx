import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/app/providers/LocaleProvider'
import { ApiError } from '@/api/error'
import { RootErrorComponent, RootNotFoundComponent, Route } from './__root'

/** The pages use Router `Link`/history, so they render inside a one-route router. */
function renderInRouter(node: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ['/somewhere'] }),
  })
  return render(
    <LocaleProvider>
      <RouterProvider router={router} />
    </LocaleProvider>,
  )
}

describe('RootErrorComponent', () => {
  it('root route의 errorComponent와 notFoundComponent로 연결된다', () => {
    expect(Route.options.errorComponent).toBe(RootErrorComponent)
    expect(Route.options.notFoundComponent).toBe(RootNotFoundComponent)
  })

  it('서버 원문 없이 일반 문구와 재시도를 제공한다', async () => {
    const reset = vi.fn()
    renderInRouter(<RootErrorComponent error={new Error('private server message')} reset={reset} />)

    expect(await screen.findByRole('heading', { name: '문제가 발생했습니다' })).toBeInTheDocument()
    expect(screen.queryByText('private server message')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('ApiError의 안전 문구·상태 숫자·trace metadata만 표시한다', async () => {
    renderInRouter(
      <RootErrorComponent
        error={new ApiError({ kind: 'contract', message: 'raw server contract', status: 200, requestId: 'req-root' })}
        reset={vi.fn()}
      />,
    )

    expect(await screen.findByRole('heading', { name: '문제가 발생했습니다' })).toBeInTheDocument()
    expect(screen.queryByText('raw server contract')).not.toBeInTheDocument()
    expect(screen.getAllByText('req-root')).toHaveLength(2)
    expect(screen.getByText('contract')).toBeInTheDocument()
    // 상태는 폴리오 숫자(aria-hidden)·sr-only 중복·trace 표에 나온다.
    expect(screen.getAllByText('200').length).toBeGreaterThanOrEqual(2)
  })

  it('403·401 은 아무것도 그리지 않고(IncidentBoundary 가 소유) 404 는 레코드 없음 페이지다', async () => {
    for (const kind of ['forbidden', 'unauthorized'] as const) {
      const { container, unmount } = renderInRouter(
        <RootErrorComponent error={new ApiError({ kind, message: 'raw', status: kind === 'forbidden' ? 403 : 401 })} reset={vi.fn()} />,
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(container.querySelector('h1')).toBeNull()
      unmount()
    }

    renderInRouter(<RootErrorComponent error={new ApiError({ kind: 'not-found', message: 'raw', status: 404 })} reset={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: '찾을 수 없습니다' })).toBeInTheDocument()
    expect(screen.getByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument()
  })
})

describe('RootNotFoundComponent', () => {
  it('route 없음과 레코드 없음을 문구로 구분하고, 히스토리가 없으면 홈 링크만 준다', async () => {
    const { unmount } = renderInRouter(<RootNotFoundComponent data={undefined} />)
    expect(await screen.findByRole('heading', { name: '찾을 수 없습니다' })).toBeInTheDocument()
    expect(screen.getByText('페이지를 찾을 수 없습니다.')).toBeInTheDocument()
    // 직접 진입(히스토리 없음)에서는 죽은 뒤로가기 대신 홈 링크 하나다.
    expect(screen.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('button', { name: '이전 화면으로 이동' })).not.toBeInTheDocument()
    unmount()

    renderInRouter(<RootNotFoundComponent data={{ kind: 'record' }} />)
    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument()
  })
})
