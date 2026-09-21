import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessageKey } from '../../lib/error-copy';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorTrace, type ErrorTraceValue } from '../feedback/ErrorTrace';

export type ListResultState = 'notSearched' | 'loading' | 'error' | 'empty' | 'ready';

/**
 * The five states are a renderable set, not a visit order every list walks, so a list
 * only labels the states it can actually reach. `searched` carries that reach in its type:
 * a list that queries on entry passes literal `true` and never labels `notSearched`; a gated
 * list passes the URL's boolean and must label it. The tuple form keeps `boolean` from
 * distributing into "either shape", which would let a gated list omit the sentence.
 */
export type ListResultCopy<TSearched extends boolean = boolean> = [TSearched] extends [true]
  ? { readonly empty: string; readonly notSearched?: undefined }
  : { readonly empty: string; readonly notSearched: string };

export interface ListResultData<TRow, TSearched extends boolean = boolean> {
  readonly rows: readonly TRow[];
  readonly searched: TSearched;
  readonly isPending: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly trace?: ErrorTraceValue | undefined;
  readonly retry: () => Promise<unknown>;
}

function resultState<TRow>(data: ListResultData<TRow, boolean>): ListResultState {
  if (!data.searched) return 'notSearched';
  if (data.isPending) return 'loading';
  if (data.isError) return 'error';
  if (data.rows.length === 0) return 'empty';
  return 'ready';
}

/** Owns common list-result fact-to-state rendering; the feature decides the plain facts and footer. */
export function ListResult<TRow, TSearched extends boolean>({
  data,
  copy,
  children,
  footer,
}: {
  readonly data: ListResultData<TRow, TSearched>;
  readonly copy: ListResultCopy<TSearched>;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}) {
  const { t } = useTranslation('shared');
  const state = resultState(data);
  // The type already ties `notSearched` to a reachable `searched: false`; inside the generic
  // body the conditional stays deferred, so read the sentence through the widest shape.
  const sentences: { readonly empty: string; readonly notSearched?: string | undefined } = copy;
  if (state === 'notSearched') return <EmptyState>{sentences.notSearched}</EmptyState>;
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
    return <><EmptyState>{sentences.empty}</EmptyState>{footer}</>;
  }

  return (
    <div aria-busy={data.isFetching || undefined}>
      {children}
      {footer}
    </div>
  );
}
