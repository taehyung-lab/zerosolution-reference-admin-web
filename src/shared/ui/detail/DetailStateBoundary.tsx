import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessageKey } from '../../lib/error-copy';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorTrace, type ErrorTraceValue } from '../feedback/ErrorTrace';

/** The facts a required single-record query exposes after the route already let the screen in. */
export interface DetailQueryFacts<TData> {
  readonly data: TData | undefined;
  readonly state: 'ready' | 'error' | 'notFound';
  readonly error: ErrorTraceValue | undefined;
  readonly retry: () => Promise<unknown>;
}

/**
 * Renders a detail's error, not-found, and ready states with the product's shared copy, so a
 * screen only says what to draw once the record is there. `ready` without data (pending or a
 * failure the app boundary owns) draws nothing; the app progress or incident surface covers it.
 */
export function DetailStateBoundary<TData>({
  query,
  children,
}: {
  readonly query: DetailQueryFacts<TData>;
  readonly children: (data: TData) => ReactNode;
}) {
  const { t } = useTranslation('shared');
  if (query.state === 'error') {
    return (
      <div role="alert">
        <EmptyState>
          <p>{t(errorMessageKey(query.error?.kind))}</p>
          <button
            className="mt-3 rounded border px-3 py-2"
            type="button"
            onClick={() => void query.retry()}
          >
            {t('error.unexpected.retry')}
          </button>
          {query.error ? <ErrorTrace value={query.error} /> : null}
        </EmptyState>
      </div>
    );
  }
  if (query.state === 'notFound') return <EmptyState>{t('error.kind.notFound')}</EmptyState>;
  return query.data === undefined ? null : children(query.data);
}
