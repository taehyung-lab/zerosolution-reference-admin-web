// 부정 대조군: 설치된 라이브러리 타입이 @deprecated 로 표시한 API 는 lint 가 잡는다.
// TanStack Query 5.102: prefetchQuery → queryClient.query(options).catch(noop)
import { QueryClient } from '@tanstack/react-query'

export function warm(client: QueryClient) {
  void client.prefetchQuery({ queryKey: ['gate'], queryFn: () => Promise.resolve(null) })
}
