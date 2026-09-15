import { useId, type ReactNode } from 'react'
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { ApiError } from '@/api/error'
import { ErrorTrace } from '@/shared/ui/feedback/ErrorTrace'
import { ModalCover } from '@/shared/ui/primitives/ModalCover'

/**
 * The app boundary pages: route not found, record not found, access denied, unexpected failure.
 * One composition — a hairline rule, the HTTP status set large as the page's folio numeral on the
 * left, title and body on the right, actions as text links. The numeral is only ever a real status
 * (404, 403, or the ApiError status); when there is none the column stays empty. The accent
 * `#E4002B` is this boundary's own choice, not a Figma variable (recorded in zero-sol-figma-analysis).
 */
export function StatusPage({
  code,
  title,
  description,
  actions,
  trace,
  titleId,
  descriptionId,
}: {
  readonly code?: string | undefined
  readonly title: string
  readonly description: string
  readonly actions: ReactNode
  readonly trace?: ReactNode
  readonly titleId?: string
  readonly descriptionId?: string
}) {
  const generatedId = useId()
  const headingId = titleId ?? generatedId
  return (
    <section aria-labelledby={headingId} className="text-neutral-900">
      <div className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        <div className="border-t border-neutral-900" />
        <div className="grid gap-10 pt-8 md:grid-cols-12 md:gap-6">
          <p
            aria-hidden={code === undefined ? undefined : 'true'}
            className="md:col-span-4 text-[clamp(5rem,16vw,11rem)] font-semibold leading-[0.85] tracking-[-0.05em] tabular-nums text-[#E4002B]"
          >
            {code}
          </p>
          <div className="md:col-span-8 md:pt-3">
            {code === undefined ? null : <span className="sr-only">{code}</span>}
            <h1 id={headingId} className="text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h1>
            <p id={descriptionId} className="mt-4 max-w-prose text-base leading-7 text-neutral-600">{description}</p>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium">{actions}</div>
            {trace ? <div className="mt-12 border-t border-neutral-200 pt-4 text-xs text-neutral-500">{trace}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}

const actionClass =
  'underline decoration-neutral-400 underline-offset-4 hover:decoration-[#E4002B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E4002B]'

function ActionButton({ children, onClick, autoFocus }: { readonly children: ReactNode; readonly onClick: () => void; readonly autoFocus?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={actionClass} autoFocus={autoFocus}>
      {children}
    </button>
  )
}

/** Back when there is history to go back to, otherwise home — a direct entry has no previous screen. */
function BackAction({ label }: { readonly label: string }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const { t } = useTranslation('shared')
  if (!canGoBack) return <Link to="/" className={actionClass}>{t('error.unexpected.home')}</Link>
  return <ActionButton onClick={() => router.history.back()}>{label}</ActionButton>
}

function HomeLink() {
  const { t } = useTranslation('shared')
  return <Link to="/" className={actionClass}>{t('error.unexpected.home')}</Link>
}

/** Route not found (`kind: 'route'`) or a record the loader could not find (`kind: 'record'`). Renders inside the router. */
export function NotFoundPage({ kind }: { readonly kind: 'route' | 'record' }) {
  const { t } = useTranslation('shared')
  const canGoBack = useCanGoBack()
  return (
    <StatusPage
      code="404"
      title={t('error.notFoundPage.title')}
      description={kind === 'record' ? t('error.kind.notFound') : t('error.notFound')}
      actions={
        <>
          <BackAction label={t('error.notFoundPage.back')} />
          {canGoBack ? <HomeLink /> : null}
        </>
      }
    />
  )
}

/**
 * Figma 1.4.3: a full grey screen, the sentence, one action that goes back. Rendered by
 * `IncidentBoundary` outside the router, as a Radix modal so focus moves to the action, the screen
 * underneath is inert and aria-hidden, and any open dialog or progress overlay sits below it (`ModalCover`).
 * The 403 numeral is a user-directed addition over the Figma frame (2026-09-11).
 */
export function AccessDeniedPage({ onBack }: { readonly onBack: () => void }) {
  const { t } = useTranslation('shared')
  const titleId = useId()
  const descriptionId = useId()
  return (
    <ModalCover labelledBy={titleId} describedBy={descriptionId} className="bg-[#F7F7F8] text-neutral-900">
      <StatusPage
        code="403"
        titleId={titleId}
        descriptionId={descriptionId}
        title={t('error.access.title')}
        description={t('error.access.description')}
        actions={<ActionButton onClick={onBack} autoFocus>{t('error.access.back')}</ActionButton>}
      />
    </ModalCover>
  )
}

export function UnexpectedErrorPage({
  description,
  error,
  onRetry,
}: {
  readonly description: string
  readonly error?: ApiError | undefined
  readonly onRetry: () => void
}) {
  const { t } = useTranslation('shared')
  return (
    <StatusPage
      code={error?.status === undefined ? undefined : String(error.status)}
      title={t('error.unexpected.title')}
      description={description}
      actions={
        <>
          <ActionButton onClick={onRetry}>{t('error.unexpected.retry')}</ActionButton>
          <HomeLink />
        </>
      }
      trace={error ? <ErrorTrace value={error} /> : undefined}
    />
  )
}
