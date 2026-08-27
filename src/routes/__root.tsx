import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import type { AppRouterContext } from '@/app/router/router'
import { env } from '@/env'

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <p className="p-6 text-sm">페이지를 찾을 수 없습니다.</p>,
})

function RootLayout() {
  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-3">
        <Link to="/" className="text-sm font-semibold">
          {env.VITE_APP_NAME}
        </Link>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
