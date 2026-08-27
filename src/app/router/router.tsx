import type { QueryClient } from '@tanstack/react-query'
import { createRouter, type RouterHistory } from '@tanstack/react-router'
import { createQueryClient } from '@/app/providers/AppProviders'
import { routeTree } from '@/routeTree.gen'

export interface RouterAuthContext {
  readonly ready: boolean
}

export interface AppRouterContext {
  readonly queryClient: QueryClient
  /** 인증 readiness 정책은 미확정이므로 context 자리만 두고 아직 값을 만들지 않는다. */
  readonly auth: RouterAuthContext | undefined
}

interface CreateAppRouterOptions {
  readonly queryClient: QueryClient
  readonly history?: RouterHistory | undefined
}

export function createAppRouter({ queryClient, history }: CreateAppRouterOptions) {
  return createRouter({
    routeTree,
    context: { queryClient, auth: undefined } satisfies AppRouterContext,
    history,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

export const queryClient = createQueryClient()
export const router = createAppRouter({ queryClient })

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
