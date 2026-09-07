import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { dormantDataQuery } from '../api/list-queries';
import type { DormantMemberRow } from '../model/member-records';
import type { MemberRecordSearch } from './member-record-search';
import { useMemberRecordRecipients } from './useMemberRecordRecipients';

const search: MemberRecordSearch = { periodType: 'joinedAt' };
const row = (phone: string, email: string): DormantMemberRow => ({
  id: 'dormant-1',
  name: '휴면회원',
  phone,
  email,
  signupMethod: 'direct',
  accountStatus: 'general',
  joinedAt: '2024-01-01T00:00:00Z',
  lastAccessedAt: '2025-01-01T00:00:00Z',
  dormantAt: '2025-06-01T00:00:00Z',
});

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <TestLocaleProvider>{children}</TestLocaleProvider>
    </QueryClientProvider>
  );
  const { result } = renderHook(
    () => useMemberRecordRecipients(search, dormantDataQuery),
    { wrapper }
  );
  const write = (rows: DormantMemberRow[]) =>
    act(() => {
      client.setQueryData(dormantDataQuery('ko', search).queryKey, {
        rows,
        total: rows.length,
        totalPages: 1,
        page: 1,
      });
    });
  return { result, write };
}

describe('member record message recipients', () => {
  it('has no target before the record page arrives', () => {
    const { result } = setup();
    expect(result.current('email', ['dormant-1'])).toEqual([]);
  });

  it('reads the page that is cached when the message is opened, not the one cached at render', () => {
    const { result, write } = setup();
    const resolve = result.current;
    write([row('01011112222', 'first@example.test')]);
    expect(resolve('email', ['dormant-1'])).toEqual([
      { name: '휴면회원', address: 'first@example.test' },
    ]);
    write([row('01033334444', 'moved@example.test')]);
    expect(resolve('email', ['dormant-1'])).toEqual([
      { name: '휴면회원', address: 'moved@example.test' },
    ]);
    expect(resolve('sms', ['dormant-1'])).toEqual([
      { name: '휴면회원', address: '01033334444' },
    ]);
  });

  it('drops selected IDs the cached page does not contain', () => {
    const { result, write } = setup();
    write([row('01011112222', 'first@example.test')]);
    expect(result.current('sms', ['dormant-1', 'missing'])).toHaveLength(1);
    expect(result.current('sms', ['missing'])).toEqual([]);
  });
});
