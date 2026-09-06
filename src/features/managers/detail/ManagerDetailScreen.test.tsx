import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { ManagerDetailScreen } from './ManagerDetailScreen';
import { ApiError } from '@/api/error';

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual as object), useQuery: vi.fn() };
});
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/managers">{children}</a>,
}));

const renderScreen = () =>
  render(
    <TestLocaleProvider>
      <ManagerDetailScreen managerId="manager-1" />
    </TestLocaleProvider>,
  );

describe('ManagerDetailScreen', () => {
  beforeEach(() => vi.mocked(useQuery).mockReset());

  it('keeps the page context while detail data is loading', () => {
    vi.mocked(useQuery).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    } as never);
    renderScreen();
    expect(screen.getByRole('heading', { name: '운영자 조회' })).toBeInTheDocument();
    expect(screen.getByText('설정 > 운영자 > 조회')).toBeInTheDocument();
  });

  it('maps update history types instead of exposing server codes', () => {
    vi.mocked(useQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        id: 'manager-1',
        name: 'Kim',
        status: { id: 'ACTIVE' },
        createdAt: '2026-08-28T00:00:00Z',
        changeLogs: [
          {
            id: 1,
            type: 'U',
            createdAt: '2026-08-28T00:00:00Z',
            manager: { name: 'Admin' },
          },
        ],
      },
    } as never);
    renderScreen();
    // 화면에는 수정 화면으로 가는 링크도 '수정'이라 표시된다. 이 단언의 대상은 이력 표의 셀이다.
    expect(screen.getByRole('cell', { name: '수정' })).toBeInTheDocument();
    expect(screen.queryByText('U')).not.toBeInTheDocument();
  });

  it('does not render not-found while the detail request is pending', () => {
    vi.mocked(useQuery).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    } as never);
    renderScreen();
    expect(screen.queryByText('운영자를 찾을 수 없습니다.')).not.toBeInTheDocument();
  });

  it('renders a recoverable generic error when the settled query has no data', () => {
    const refetch = vi.fn();
    vi.mocked(useQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: undefined,
      refetch,
    } as never);
    renderScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('운영자 정보를 불러오지 못했습니다.');
    expect(screen.queryByText('운영자를 찾을 수 없습니다.')).not.toBeInTheDocument();
    screen.getByRole('button', { name: '다시 시도' }).click();
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders not-found only for an ApiError with kind not-found', () => {
    vi.mocked(useQuery).mockReturnValue({
      isPending: false,
      isError: true,
      error: new ApiError({
        kind: 'not-found',
        message: 'raw missing',
        status: 404,
      }),
    } as never);
    renderScreen();
    expect(screen.getByText('운영자를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByText('raw missing')).not.toBeInTheDocument();
  });

  it('shows safe recoverable copy, retry, and request trace for other errors', () => {
    const refetch = vi.fn();
    vi.mocked(useQuery).mockReturnValue({
      isPending: false,
      isError: true,
      error: new ApiError({
        kind: 'timeout',
        message: 'server raw',
        status: 504,
        requestId: 'req-detail',
      }),
      refetch,
    } as never);
    renderScreen();
    expect(screen.getByRole('alert')).not.toHaveTextContent('server raw');
    expect(screen.getAllByText('req-detail')).toHaveLength(2);
    screen.getByRole('button', { name: '다시 시도' }).click();
    expect(refetch).toHaveBeenCalledOnce();
  });
});
