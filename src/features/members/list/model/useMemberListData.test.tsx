import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/error';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { selectMemberProfilePage } from '../../fixtures/members';
vi.mock(import('../../fixtures/members'), async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, selectMemberProfilePage: vi.fn(actual.selectMemberProfilePage) };
});
import { useMemberListData } from './useMemberListData';
import type { MemberRouteSearch } from './search-schema';

afterEach(() => vi.resetAllMocks());
it('검색 전에는 요청하지 않고 검색 후 mock 행과 실제 조회 상태를 전달한다', async () => {
  const read = vi.mocked(selectMemberProfilePage);
  const { result, rerender } = renderHook(({ search }: { search: MemberRouteSearch }) => useMemberListData(search, 'all'), { initialProps: { search: {} }, wrapper: TestQueryLocaleProvider });
  expect(result.current.searched).toBe(false);
  expect(read).not.toHaveBeenCalled();
  rerender({ search: { periodType: 'joinedAt' } });
  expect(result.current.isPending).toBe(true);
  await waitFor(() => expect(result.current.rows).toHaveLength(2));
  expect(result.current.isFetching).toBe(false);
  rerender({ search: { periodType: 'joinedAt', keywords: [{ field: 'email', value: 'does-not-exist' }] } });
  await waitFor(() => expect(result.current.rows).toHaveLength(0));
  expect(result.current.isError).toBe(false);
});
it('조회 응답을 화면 행으로 바꾸는 책임은 feature가 가진다', async () => {
  const { result } = renderHook(() => useMemberListData({ periodType: 'joinedAt' }, 'general'), { wrapper: TestQueryLocaleProvider });
  await waitFor(() => expect(result.current.rows).toHaveLength(1));
  const [row] = result.current.rows;
  expect(vi.mocked(selectMemberProfilePage).mock.results[0]?.value).toMatchObject({ rows: [{ email: 'general@example.test' }] });
  expect(row?.email).toBe('gene***@example.test');
  expect(row?.accountStatus).toBe('일반회원');
});
it('조회 실패를 빈 성공으로 숨기지 않고 같은 Query를 재시도한다', async () => {
  const original = vi.mocked(selectMemberProfilePage).getMockImplementation()!;
  const read = vi.mocked(selectMemberProfilePage).mockImplementation(() => { throw new ApiError({ kind: 'network', message: 'test' }); });
  const { result } = renderHook(() => useMemberListData({ periodType: 'joinedAt' }, 'all'), { wrapper: TestQueryLocaleProvider });
  await waitFor(() => expect(result.current.isError).toBe(true));
  read.mockImplementation(original);
  await act(async () => { await result.current.retry(); });
  await waitFor(() => expect(result.current.isError).toBe(false));
  expect(result.current.rows).toHaveLength(2);
});
