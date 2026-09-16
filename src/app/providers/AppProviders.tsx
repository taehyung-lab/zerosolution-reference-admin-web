import { ApiError, type ApiErrorKind } from '@/api/error'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { LocaleProvider } from './LocaleProvider'
import { AuthProvider } from './AuthProvider'

/**
 * 결정적 실패(없음·권한·인증·검증·업무·충돌)는 다시 보내도 답이 같다. 재시도하면 404 페이지가 1초 늦고,
 * 403 incident 가 두 번 발행되며, 첫 실패가 `fetchFailureReason` 에만 남아 incident boundary 의
 * query 대조가 빗나간다(2026-09-11 실측). 나머지 실패만 한 번 더 시도한다. 소유: api-contract query-cache.md.
 */
const DETERMINISTIC_KINDS = new Set<ApiErrorKind>(['not-found', 'forbidden', 'unauthorized', 'validation', 'business', 'conflict'])
export function retryOnce(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && DETERMINISTIC_KINDS.has(error.kind)) return false
  return failureCount < 1
}

/**
 * A mutation's `meta.invalidates` lists the cache families its success makes stale; this is the one
 * place that acts on it, so no screen wires `onSuccess` invalidation by hand (`ApiMutationMeta`).
 */
export function createQueryClient(): QueryClient {
  const client: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // 목록 화면의 SOT는 URL search이며, Router preload가 Query freshness와
        // 경쟁하지 않도록 router 쪽 defaultPreloadStaleTime을 0으로 둔다.
        staleTime: 30_000,
        retry: retryOnce,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) =>
        Promise.all(
          (mutation.meta?.invalidates ?? []).map((queryKey) => client.invalidateQueries({ queryKey })),
        ),
    }),
  })
  return client
}

export function AppProviders({
  children,
  queryClient,
}: {
  children: ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocaleProvider>{children}</LocaleProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
