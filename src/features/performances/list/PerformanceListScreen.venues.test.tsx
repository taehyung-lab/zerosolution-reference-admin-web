import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/error';
import { TestLocaleProvider } from '@/test/locale';
import {
  readPerformancePage,
  readPerformanceVenues,
} from '../fixtures/performances';
vi.mock(import('../fixtures/performances'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readPerformancePage: vi.fn(actual.readPerformancePage),
    readPerformanceVenues: vi.fn(actual.readPerformanceVenues),
  };
});
import { performanceVenuesQuery } from '../api/queries';
import { PerformanceListScreen } from './PerformanceListScreen';

afterEach(() => vi.resetAllMocks());

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TestLocaleProvider>
        <PerformanceListScreen
          search={{}}
          onSearchChange={vi.fn()}
          onActivate={vi.fn()}
        />
      </TestLocaleProvider>
    </QueryClientProvider>
  );
  return client;
}

describe('performance venue option supply', () => {
  it('reads the venue options from the feature query when the caller injects none', async () => {
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    setup();
    fireEvent.change(
      await screen.findByRole('textbox', { name: '공연장 검색' }),
      { target: { value: 'Reference' } }
    );
    expect(
      await screen.findByRole('button', { name: 'Reference Hall A' })
    ).toBeVisible();
    expect(vi.mocked(readPerformanceVenues)).toHaveBeenCalledOnce();
  });

  it('shows the failed option read with a retry instead of an empty venue list, then recovers', async () => {
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    const read = vi
      .mocked(readPerformanceVenues)
      .mockRejectedValueOnce(new ApiError({ kind: 'network', message: 'test' }));
    setup();
    expect(
      await screen.findByText('옵션을 불러오지 못했습니다.')
    ).toBeVisible();
    expect(screen.queryByRole('textbox', { name: '공연장 검색' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '공연장 다시 시도' }));
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByText('옵션을 불러오지 못했습니다.')).toBeNull()
    );
    fireEvent.change(screen.getByRole('textbox', { name: '공연장 검색' }), {
      target: { value: 'Reference' },
    });
    expect(
      await screen.findByRole('button', { name: 'Reference Hall B' })
    ).toBeVisible();
  });

  it('does not query venues at all when the caller supplies them', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    render(
      <QueryClientProvider client={client}>
        <TestLocaleProvider>
          <PerformanceListScreen
            search={{}}
            onSearchChange={vi.fn()}
            onActivate={vi.fn()}
            venues={[{ id: 'injected', name: 'Injected Hall' }]}
          />
        </TestLocaleProvider>
      </QueryClientProvider>
    );
    fireEvent.change(
      await screen.findByRole('textbox', { name: '공연장 검색' }),
      { target: { value: 'Injected' } }
    );
    expect(
      await screen.findByRole('button', { name: 'Injected Hall' })
    ).toBeVisible();
    expect(vi.mocked(readPerformanceVenues)).not.toHaveBeenCalled();
    expect(screen.queryByText('옵션을 불러오는 중입니다.')).toBeNull();
  });
});

describe('performance venue option refresh', () => {
  it('keeps the loaded venue chooser usable when a later refresh fails', async () => {
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    const read = vi.mocked(readPerformanceVenues);
    const client = setup();
    fireEvent.change(
      await screen.findByRole('textbox', { name: '공연장 검색' }),
      { target: { value: 'Reference' } }
    );
    expect(
      await screen.findByRole('button', { name: 'Reference Hall A' })
    ).toBeVisible();
    read.mockRejectedValueOnce(
      new ApiError({ kind: 'network', message: 'refresh' })
    );
    await act(async () => {
      await client.refetchQueries({
        queryKey: performanceVenuesQuery('ko').queryKey,
      });
    });
    expect(read).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('옵션을 불러오지 못했습니다.')).toBeNull();
    expect(screen.getByRole('textbox', { name: '공연장 검색' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Reference Hall A' })
    ).toBeVisible();
  });
});
