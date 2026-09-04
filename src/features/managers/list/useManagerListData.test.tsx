import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { useManagerListData } from './useManagerListData';

const { getList8 } = vi.hoisted(() => ({
  getList8: vi.fn().mockResolvedValue({ list: [], totalCount: 0 }),
}));

vi.mock('@/api/generated/endpoints', () => ({
  getList8,
  get8: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TestLocaleProvider>{children}</TestLocaleProvider>
      </QueryClientProvider>
    );
  };
}

describe('useManagerListData', () => {
  beforeEach(() => getList8.mockClear());

  it('does not fetch before the searched discriminator is present', async () => {
    const { result } = renderHook(() => useManagerListData({}), {
      wrapper: createWrapper(),
    });

    expect(result.current).toMatchObject({
      rows: [],
      total: 0,
      totalPages: 1,
      searched: false,
    });
    expect(result.current).not.toHaveProperty('state');
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(getList8).not.toHaveBeenCalled();
  });

  it('fetches an applied search with the same resolved contract', async () => {
    const { result } = renderHook(
      () => useManagerListData({ periodType: 'CREATED_AT' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(getList8).toHaveBeenCalledTimes(1));
    expect(result.current.searched).toBe(true);
    expect(getList8).toHaveBeenCalledWith(
      expect.objectContaining({
        periodType: 'CREATED_AT',
        pageNo: 1,
        pageSize: 100,
        sortType: 'CREATED_AT',
        sortDirection: 'DESC',
      }),
    );
  });
});
