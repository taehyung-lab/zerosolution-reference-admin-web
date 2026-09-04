import { createRootRouteWithContext, Outlet, type ErrorComponentProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { AppRouterContext } from '@/app/router/router'
import { ApiError, type ApiErrorKind } from '@/api/error'
import { ErrorTrace } from '@/shared/ui/patterns/ErrorTrace'

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: RootLayout,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
})

export function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation('shared')
  const apiError = error instanceof ApiError ? error : undefined
  const body = apiError ? t(rootSafeErrorKey(apiError.kind)) : t('error.unexpected.body')

  return (
    <section className="p-6">
      <div role="alert">
        <h1 className="text-lg font-semibold">{t('error.unexpected.title')}</h1>
        <p className="mt-2 text-sm text-neutral-600">{body}</p>
        {apiError ? <ErrorTrace value={apiError} /> : null}
        <div className="mt-4 flex gap-3">
          <button type="button" className="text-sm underline" onClick={reset}>
            {t('error.unexpected.retry')}
          </button>
          <a href="/" className="text-sm underline">
            {t('error.unexpected.home')}
          </a>
        </div>
      </div>
      {/* Developer-only. A non-API failure has no requestId to quote, so the build-only
          name/message is the sole signal — without it a render or loader crash reports nothing.
          It sits outside the alert so the announced copy never carries raw JS text. */}
      {!apiError && import.meta.env.DEV ? (
        <code className="mt-4 block text-xs text-neutral-500">
          {error instanceof Error ? `${error.name}: ${error.message}` : 'UnknownError'}
        </code>
      ) : null}
    </section>
  )
}

function rootSafeErrorKey(kind: ApiErrorKind) {
  switch (kind) {
    case 'network': return 'error.kind.network' as const
    case 'timeout': return 'error.kind.timeout' as const
    case 'cancelled': return 'error.kind.cancelled' as const
    case 'business': return 'error.kind.business' as const
    case 'unauthorized': return 'error.kind.unauthorized' as const
    case 'forbidden': return 'error.kind.forbidden' as const
    case 'validation': return 'error.kind.validation' as const
    case 'not-found': return 'error.kind.notFound' as const
    case 'conflict': return 'error.kind.conflict' as const
    case 'rate-limited': return 'error.kind.rateLimited' as const
    case 'server-error': return 'error.kind.serverError' as const
    case 'contract': return 'error.kind.contract' as const
  }
}

function RootNotFoundComponent() {
  const { t } = useTranslation('shared')
  return <p className="p-6 text-sm">{t('error.notFound')}</p>
}

function RootLayout() {
  return <Outlet />
}
