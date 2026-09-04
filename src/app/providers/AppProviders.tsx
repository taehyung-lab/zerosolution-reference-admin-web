import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { LocaleProvider } from './LocaleProvider'
import { AuthProvider } from './AuthProvider'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 목록 화면의 SOT는 URL search이며, Router preload가 Query freshness와
        // 경쟁하지 않도록 router 쪽 defaultPreloadStaleTime을 0으로 둔다.
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
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
