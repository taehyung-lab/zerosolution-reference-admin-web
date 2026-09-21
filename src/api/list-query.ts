import {
  hashKey,
  keepPreviousData,
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useState } from 'react';
import type { ApiError } from './error';
import { isFeatureError } from './error-outcome';
import { blockingProgress, contentProgress } from './query-meta';

/** The facts a paged list exposes; nothing else decides its result state. */
export interface ListQueryResult<TRow, TSearched extends boolean = boolean> {
  readonly rows: readonly TRow[];
  readonly total: number;
  /** Literal `true` for a list that queries on entry; a gated list carries the URL's boolean. */
  readonly searched: TSearched;
  readonly isPending: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly trace: ApiError | undefined;
  readonly retry: () => Promise<unknown>;
}

/**
 * Runs one paged list query and projects it to the facts a list result renders, the way
 * `useDetailQuery` does for a required single record. A list differs from a required record
 * in three ways this owns so no list re-decides them:
 *
 * - an empty page is a result, never `not-found` or an error;
 * - only the fetch a screen enters on may open the blocking overlay, later ones stay on content;
 * - a failure the app incident surface owns (session, permission) is not the list's error.
 *
 * The caller keeps its contract: `options`, what counts as searched, and how the response
 * becomes rows and a total.
 */
export function useListQuery<
  TResponse,
  TRow,
  TSearched extends boolean,
  TKey extends QueryKey = QueryKey,
>({
  options,
  searched,
  select,
}: {
  readonly options: UseQueryOptions<TResponse, Error, TResponse, TKey>;
  readonly searched: TSearched;
  readonly select: (data: TResponse) => {
    readonly rows: readonly TRow[];
    readonly total: number;
  };
}): ListQueryResult<TRow, TSearched> {
  const [entryQueryHash] = useState(() =>
    searched ? hashKey(options.queryKey) : undefined
  );
  const entryFetch = entryQueryHash === hashKey(options.queryKey);
  const query = useQuery({
    ...options,
    enabled: searched,
    placeholderData: keepPreviousData,
    ...(entryFetch ? blockingProgress : contentProgress),
  });
  const page = query.data === undefined ? undefined : select(query.data);
  const error = isFeatureError(query.error) ? query.error : undefined;

  return {
    rows: page?.rows ?? [],
    total: page?.total ?? 0,
    searched,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError && error !== undefined,
    trace: error,
    retry: query.refetch,
  };
}
