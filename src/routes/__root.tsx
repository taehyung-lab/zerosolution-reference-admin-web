import { createRootRouteWithContext, Outlet, type ErrorComponentProps, type NotFoundRouteProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { AppRouterContext } from '@/app/router/router'
import { isRequiredNotFoundData } from '@/app/router/required-loader'
import { NotFoundPage, UnexpectedErrorPage } from '@/app/error-boundary/StatusPage'
import { ApiError } from '@/api/error'
import { safeErrorKey } from '@/api/error-copy'

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
        description={apiError ? t(safeErrorKey(apiError.kind)) : t('error.unexpected.body')}
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

export function RootNotFoundComponent({ data }: Pick<NotFoundRouteProps, 'data'>) {
  return <NotFoundPage kind={isRequiredNotFoundData(data) ? 'record' : 'route'} />
}

function RootLayout() {
  return <Outlet />
}
