import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/error';
import { performanceVenuesQuery } from '@/features/performances/api/queries';
import { readPerformancePage, readPerformanceVenues } from '@/features/performances/fixtures/performances';
import { TestLocaleProvider } from '@/test/locale';
import { PerformanceListScreen } from './PerformanceListScreen';

vi.mock(import('@/features/performances/fixtures/performances'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readPerformancePage: vi.fn(actual.readPerformancePage),
    readPerformanceVenues: vi.fn(actual.readPerformanceVenues),
  };
});

afterEach(() => vi.resetAllMocks());

function setup(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  render(
    <QueryClientProvider client={client}>
      <TestLocaleProvider>
        <PerformanceListScreen search={{}} onSearchChange={vi.fn()} onActivate={vi.fn()} />
      </TestLocaleProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe('공연장 선택지 공급', () => {
  it('선택지를 feature query 로 읽고 검색어로 좁힌다', async () => {
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    setup();
    fireEvent.change(await screen.findByRole('textbox', { name: '공연장 검색' }), { target: { value: 'Reference' } });
    expect(await screen.findByRole('button', { name: 'Reference Hall A' })).toBeVisible();
    expect(vi.mocked(readPerformanceVenues)).toHaveBeenCalledOnce();
  });

  it('조회 실패를 빈 목록으로 숨기지 않고 재시도로 복구한다', async () => {
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    const read = vi
      .mocked(readPerformanceVenues)
      .mockRejectedValueOnce(new ApiError({ kind: 'network', message: 'test' }));
    setup();

    expect(await screen.findByText('옵션을 불러오지 못했습니다.')).toBeVisible();
    expect(screen.queryByRole('textbox', { name: '공연장 검색' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '공연장 다시 시도' }));
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    fireEvent.change(await screen.findByRole('textbox', { name: '공연장 검색' }), { target: { value: 'Reference' } });
    expect(await screen.findByRole('button', { name: 'Reference Hall B' })).toBeVisible();
  });

  it('미리 채워진 선택지는 다시 읽지 않고 쓴다', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    vi.mocked(readPerformanceVenues).mockResolvedValue([{ id: 'warmed', name: 'Warmed Hall' }]);
    await client.query(performanceVenuesQuery('ko'));
    setup(client);

    fireEvent.change(await screen.findByRole('textbox', { name: '공연장 검색' }), { target: { value: 'Warmed' } });
    expect(await screen.findByRole('button', { name: 'Warmed Hall' })).toBeVisible();
    expect(vi.mocked(readPerformanceVenues)).toHaveBeenCalledOnce();
    expect(screen.queryByText('옵션을 불러오는 중입니다.')).toBeNull();
  });

  it('갱신 실패는 이미 받은 선택지를 빼앗지 않는다', async () => {
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    const read = vi.mocked(readPerformanceVenues);
    const client = setup();
    fireEvent.change(await screen.findByRole('textbox', { name: '공연장 검색' }), { target: { value: 'Reference' } });
    expect(await screen.findByRole('button', { name: 'Reference Hall A' })).toBeVisible();

    read.mockRejectedValueOnce(new ApiError({ kind: 'network', message: 'refresh' }));
    await act(async () => {
      await client.refetchQueries({ queryKey: performanceVenuesQuery('ko').queryKey });
    });
    expect(read).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('옵션을 불러오지 못했습니다.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Reference Hall A' })).toBeVisible();
  });
});
