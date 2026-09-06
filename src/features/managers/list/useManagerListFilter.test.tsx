import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { type ManagerRouteSearch } from './search-schema';
import { useManagerListFilter } from './useManagerListFilter';

const { getManagerTypes } = vi.hoisted(() => ({
  getManagerTypes: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/generated/endpoints', () => ({ getManagerTypes }));

function Providers({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TestLocaleProvider>{children}</TestLocaleProvider>
    </QueryClientProvider>
  );
}

describe('useManagerListFilter', () => {
  it('provides every Manager-owned static option set to the filter UI', () => {
    const { result } = renderHook(
      () => useManagerListFilter({ search: {}, onSearchChange: vi.fn() }),
      { wrapper: Providers },
    );

    expect(result.current.options.keywordType.map(({ value }) => value)).toEqual([
      'ID',
      'NAME',
      'PHONE',
      'ORGANIZATION',
      'PERMISSION',
    ]);
  });

  it('records only periodType when submitting default filters', () => {
    const onSearchChange = vi.fn();
    const { result } = renderHook(() => useManagerListFilter({ search: {}, onSearchChange }), {
      wrapper: Providers,
    });

    act(() => result.current.submit({ preventDefault: vi.fn() } as never));

    expect(onSearchChange).toHaveBeenCalledWith({
      periodType: 'CREATED_AT',
    });
  });

  it('drops the committed page when applying a filter from a later page', () => {
    const onSearchChange = vi.fn();
    const { result } = renderHook(
      () =>
        useManagerListFilter({
          search: { periodType: 'CREATED_AT', page: 3 },
          onSearchChange,
        }),
      { wrapper: Providers },
    );

    act(() => result.current.patchDraft({ types: ['AGENCY'] }));
    act(() => result.current.submit({ preventDefault: vi.fn() } as never));

    // Apply 는 같은 navigation 에서 page 를 되돌린다. 새 조건의 결과를 3페이지부터 보여 주지 않는다.
    expect(onSearchChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('page');
    expect(onSearchChange).toHaveBeenLastCalledWith(expect.objectContaining({ types: ['AGENCY'] }));
  });

  it('replaces stale draft when committed route search changes externally', () => {
    const onSearchChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ search }: { search: ManagerRouteSearch }) =>
        useManagerListFilter({ search, onSearchChange }),
      {
        wrapper: Providers,
        initialProps: { search: { periodType: 'CREATED_AT' } },
      },
    );
    act(() => result.current.patchDraft({ types: ['AGENCY'] }));
    expect(result.current.draft.types).toEqual(['AGENCY']);

    rerender({
      search: { periodType: 'CREATED_AT', page: 2, sortDirection: 'ASC' },
    });
    expect(result.current.draft.types).toEqual(['AGENCY']);
    // View state never enters the draft, so a page or sort change cannot discard it.
    expect(result.current.draft).not.toHaveProperty('page');
    expect(result.current.draft).not.toHaveProperty('sortDirection');

    const external: ManagerRouteSearch = {
      periodType: 'CREATED_AT',
      types: ['VENDOR'],
    };
    rerender({ search: external });
    expect(result.current.draft.types).toEqual(['VENDOR']);
  });

  it('clears the draft and navigates to an empty search even when the URL is already empty', () => {
    const onSearchChange = vi.fn();
    const { result } = renderHook(() => useManagerListFilter({ search: {}, onSearchChange }), {
      wrapper: Providers,
    });
    act(() => result.current.patchDraft({ types: ['AGENCY'] }));
    act(() => result.current.setRange({ from: '2026-09-01', to: '2026-08-31' }));
    act(() => result.current.setPendingKeywordField('PHONE'));
    act(() => result.current.setPendingKeywordValue('010'));
    act(() => {
      result.current.addPendingKeyword();
    });

    act(() => result.current.reset());

    expect(result.current.draft.types).toEqual([]);
    expect(result.current.preset).toBe('ALL');
    expect(result.current.range).toEqual({});
    expect(result.current.keywordItems).toEqual([]);
    expect(result.current.pendingKeyword).toEqual({ field: 'ID', value: '' });
    expect(onSearchChange).toHaveBeenCalledWith({});
  });

  it('preserves uncommitted filters when only page size changes', () => {
    const onSearchChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ search }: { search: ManagerRouteSearch }) =>
        useManagerListFilter({ search, onSearchChange }),
      {
        wrapper: Providers,
        initialProps: { search: { periodType: 'CREATED_AT' } },
      },
    );
    act(() => result.current.patchDraft({ types: ['AGENCY'] }));

    rerender({ search: { periodType: 'CREATED_AT', pageSize: 200 } });

    expect(result.current.draft.types).toEqual(['AGENCY']);
    // Page size is view state: it is not in the draft, and submit carries it from the URL.
    act(() => result.current.submit({ preventDefault: vi.fn() } as never));
    expect(onSearchChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageSize: 200, types: ['AGENCY'] }),
    );
  });

  it('keeps resolved option data visible when a background retry fails', async () => {
    getManagerTypes.mockResolvedValueOnce([{ id: 'AGENCY', name: '기획사' }]);
    const { result } = renderHook(
      () => useManagerListFilter({ search: {}, onSearchChange: vi.fn() }),
      { wrapper: Providers },
    );
    await waitFor(() => expect(result.current.typeOptions.state).toBe('ready'));

    getManagerTypes.mockRejectedValueOnce(new Error('retry failed'));
    await act(async () => {
      await result.current.typeOptions.retry();
    });

    expect(result.current.typeOptions.state).toBe('ready');
    expect(result.current.typeOptions.items).toEqual([{ value: 'AGENCY', label: '기획사' }]);
  });
});
