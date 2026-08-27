import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { AppProviders, createQueryClient } from '@/app/providers/AppProviders'
import { createAppRouter } from './router'

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
        <RouterProvider router={router} />
      </AppProviders>,
    ),
  }
}

describe('router 진입', () => {
  it('route loader가 같은 QueryClient를 읽을 수 있는 context를 가진다', async () => {
    const { queryClient, router } = renderAt('/')
    expect(router.options.context.queryClient).toBe(queryClient)
    expect(router.options.context.auth).toBeUndefined()
    expect(await screen.findByRole('heading', { name: 'bootstrap ok' })).toBeInTheDocument()
  })

  it('없는 경로는 not-found를 렌더한다', async () => {
    renderAt('/definitely-not-a-route')
    expect(await screen.findByText('페이지를 찾을 수 없습니다.')).toBeInTheDocument()
  })
})
