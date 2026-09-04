import type { QueryClient } from '@tanstack/react-query'
import { createRouter, RouterProvider, type RouterHistory } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import { useLocale } from '@/shared/i18n/locale-context'
import { DEFAULT_UI_LOCALE, type UiLocale } from '@/shared/i18n/locale'

export interface AppRouterContext {
  readonly queryClient: QueryClient
  readonly locale: UiLocale
}

interface CreateAppRouterOptions {
  readonly queryClient: QueryClient
  readonly history?: RouterHistory | undefined
}

export function createAppRouter({ queryClient, history }: CreateAppRouterOptions) {
  return createRouter({
    routeTree,
    context: { queryClient, locale: DEFAULT_UI_LOCALE } satisfies AppRouterContext,
    history,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

export function AppRouterProvider({
  router,
}: {
  readonly router: ReturnType<typeof createAppRouter>
}) {
  const { locale } = useLocale()
  return <RouterProvider router={router} context={{ locale }} />
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
