import { useTranslation } from 'react-i18next'

/**
 * Route-level pending surface for a loader that awaits a required query. That query has no
 * observer while the loader runs, so `BlockingProgress` (which covers only observed pending
 * queries) stays closed; the router shows this after its default pending delay instead.
 */
export function RoutePending() {
  const { t } = useTranslation('shared')
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 p-6 text-sm text-neutral-600">
      <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
      {t('progress.loading')}
    </div>
  )
}
