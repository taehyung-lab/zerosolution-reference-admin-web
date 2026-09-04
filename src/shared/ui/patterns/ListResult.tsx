import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './EmptyState';
import { ErrorTrace, type ErrorTraceValue } from './ErrorTrace';

export type ListResultState = 'notSearched' | 'loading' | 'error' | 'empty' | 'ready';

/**
 * The four states are a renderable set, not a visit order every list walks, so a list
 * only labels the states it can actually reach.
 */
export interface ListResultCopy {
  readonly notSearched: string;
  readonly empty: string;
}

export interface ListResultData<TRow> {
  readonly rows: readonly TRow[];
  readonly searched: boolean;
  readonly isPending: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly trace?: ErrorTraceValue | undefined;
  readonly retry: () => Promise<unknown>;
}

function resultState<TRow>(data: ListResultData<TRow>): ListResultState {
  if (!data.searched) return 'notSearched';
  if (data.isPending) return 'loading';
  if (data.isError) return 'error';
  if (data.rows.length === 0) return 'empty';
  return 'ready';
}

/** Owns common list-result fact-to-state rendering; the feature decides the plain facts and footer. */
export function ListResult<TRow>({
  data,
  copy,
  children,
  footer,
}: {
  readonly data: ListResultData<TRow>;
  readonly copy: ListResultCopy;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}) {
  const { t } = useTranslation('shared');
  const state = resultState(data);
  if (state === 'notSearched') return <EmptyState>{copy.notSearched}</EmptyState>;
  if (state === 'loading') return <EmptyState><span aria-live="polite">{t('progress.loading')}</span></EmptyState>;
  if (state === 'error') {
    return (
      <div role="alert">
        <EmptyState>
          <p>{t(errorMessageKey(data.trace?.kind))}</p>
          <button className="mt-3 rounded border px-3 py-2" type="button" onClick={() => void data.retry()}>{t('error.unexpected.retry')}</button>
          {data.trace ? <ErrorTrace value={data.trace} /> : null}
        </EmptyState>
      </div>
    );
  }
  if (state === 'empty') {
    return <><EmptyState>{copy.empty}</EmptyState>{footer}</>;
  }

  return (
    <div aria-busy={data.isFetching || undefined}>
      {children}
      {footer}
    </div>
  );
}

function errorMessageKey(kind: string | undefined) {
  switch (kind) {
    case 'network': return 'error.kind.network' as const;
    case 'timeout': return 'error.kind.timeout' as const;
    case 'cancelled': return 'error.kind.cancelled' as const;
    case 'business': return 'error.kind.business' as const;
    case 'unauthorized': return 'error.kind.unauthorized' as const;
    case 'forbidden': return 'error.kind.forbidden' as const;
    case 'validation': return 'error.kind.validation' as const;
    case 'not-found': return 'error.kind.notFound' as const;
    case 'conflict': return 'error.kind.conflict' as const;
    case 'rate-limited': return 'error.kind.rateLimited' as const;
    case 'server-error': return 'error.kind.serverError' as const;
    case 'contract': return 'error.kind.contract' as const;
    default: return 'error.unexpected.body' as const;
  }
}
