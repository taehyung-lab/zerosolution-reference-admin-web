import { createRootRouteWithContext, Outlet, type ErrorComponentProps, type NotFoundRouteProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { AppRouterContext } from '@/app/router/router'
import { isRequiredNotFoundData } from '@/app/router/required-loader'
import { NotFoundPage, UnexpectedErrorPage } from '@/app/error-boundary/StatusPage'
import { ApiError, type ApiErrorKind } from '@/api/error'

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: RootLayout,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
})

/**
 * Root placement (`resolveErrorOutcome`: route-loader/render → root), shell-less; `_app` wraps the
 * same components in the shell. A 403 renders nothing here: `IncidentBoundary` owns the access
 * cover (a loader republishes the incident with `origin: 'route-loader'`, see `loadRequired`), and
 * this only removes the failed screen underneath. A 404 thrown as an ApiError still reads as not found.
 */
export function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation('shared')
  const apiError = error instanceof ApiError ? error : undefined
  // Session and access failures belong to IncidentBoundary (login redirect, access cover).
  if (apiError?.kind === 'forbidden' || apiError?.kind === 'unauthorized') return null
  if (apiError?.kind === 'not-found') return <NotFoundPage kind="record" />
  return (
    <>
      <UnexpectedErrorPage
        description={apiError ? t(rootSafeErrorKey(apiError.kind)) : t('error.unexpected.body')}
        error={apiError}
        onRetry={reset}
      />
      {!apiError && import.meta.env.DEV ? (
        <code className="mx-auto block max-w-5xl px-6 pb-8 text-xs text-neutral-500">
          {error instanceof Error ? `${error.name}: ${error.message}` : 'UnknownError'}
        </code>
      ) : null}
    </>
  )
}

/** Kinds the unexpected-error page can receive: the incident and not-found kinds returned above. */
type RootErrorKind = Exclude<ApiErrorKind, 'forbidden' | 'unauthorized' | 'not-found'>

function rootSafeErrorKey(kind: RootErrorKind) {
  switch (kind) {
    case 'network': return 'error.kind.network' as const
    case 'timeout': return 'error.kind.timeout' as const
    case 'cancelled': return 'error.kind.cancelled' as const
    case 'business': return 'error.kind.business' as const
    case 'validation': return 'error.kind.validation' as const
    case 'conflict': return 'error.kind.conflict' as const
    case 'rate-limited': return 'error.kind.rateLimited' as const
    case 'server-error': return 'error.kind.serverError' as const
    case 'contract': return 'error.kind.contract' as const
  }
}

export function RootNotFoundComponent({ data }: Pick<NotFoundRouteProps, 'data'>) {
  return <NotFoundPage kind={isRequiredNotFoundData(data) ? 'record' : 'route'} />
}

function RootLayout() {
  return <Outlet />
}
