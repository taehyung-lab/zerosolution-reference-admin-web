import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ComponentProps } from 'react';
import { TestLocaleProvider } from './locale';
/** 비동기 조회를 소비하는 화면 테스트마다 독립 캐시를 제공한다. rerender에서는 같은 캐시를 유지한다. */
export function TestQueryLocaleProvider(props: ComponentProps<typeof TestLocaleProvider>) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } }));
  return <QueryClientProvider client={client}><TestLocaleProvider {...props} /></QueryClientProvider>;
}
