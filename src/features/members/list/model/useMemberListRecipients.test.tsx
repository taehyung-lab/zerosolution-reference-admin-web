import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { memberListQuery } from '../../api/list-queries';
import type { MemberProfile } from '../../model/member-profile';
import { resolveMemberSearch, type MemberRouteSearch } from './search-schema';
import { useMemberListRecipients } from './useMemberListRecipients';

function profile(id: string, phone: string, email: string): MemberProfile {
  return {
    id,
    email,
    values: {
      accountStatus: 'general',
      restrictions: [],
      name: `이름-${id}`,
      birthDate: '1995-05-05',
      phone,
    },
    joinedAt: '2026-09-01T01:00:00Z',
    lastAccessedAt: '2026-09-05T01:00:00Z',
    signupMethod: 'direct',
  };
}

const search: MemberRouteSearch = { periodType: 'joinedAt' };

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
    () => useMemberListRecipients(search, 'all'),
    { wrapper }
  );
  const write = (rows: readonly MemberProfile[]) =>
    act(() => {
      client.setQueryData(
        memberListQuery('ko', resolveMemberSearch(search), 'all').queryKey,
        { rows, total: rows.length }
      );
    });
  return { result, write };
}

describe('member list message recipients', () => {
  it('has no target before the list page arrives and never invents an address', () => {
    const { result } = setup();
    expect(result.current('sms', ['one'])).toEqual([]);
  });

  it('reads the page that is cached when the message is opened, not the one cached at render', () => {
    const { result, write } = setup();
    const resolve = result.current;
    write([profile('one', '010-1111-2222', 'one@example.test')]);
    expect(resolve('sms', ['one'])).toEqual([
      { name: '이름-one', address: '010-1111-2222' },
    ]);
    write([profile('one', '010-3333-4444', 'moved@example.test')]);
    expect(resolve('sms', ['one'])).toEqual([
      { name: '이름-one', address: '010-3333-4444' },
    ]);
    expect(resolve('email', ['one'])).toEqual([
      { name: '이름-one', address: 'moved@example.test' },
    ]);
  });

  it('drops selected IDs the cached page does not contain', () => {
    const { result, write } = setup();
    write([profile('one', '010-1111-2222', 'one@example.test')]);
    expect(result.current('sms', ['one', 'missing'])).toHaveLength(1);
  });
});
