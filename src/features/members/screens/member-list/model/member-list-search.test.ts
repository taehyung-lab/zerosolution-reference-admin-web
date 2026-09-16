import { describe, expect, it } from 'vitest';
import { memberListDefinitions } from './member-list-definition';
import { memberListSearch, toMemberListRequest } from './member-list-search';

describe('memberListSearch', () => {
  it('keeps an empty URL as pre-search, marks any valid condition as searched, and omits defaults', () => {
    expect(memberListSearch.canonical.parse({})).toEqual({});
    expect(memberListSearch.canonical.parse({ searched: false, page: 2 })).toEqual({});
    expect(memberListSearch.canonical.parse({ searched: true })).toEqual({ searched: true });
    expect(memberListSearch.canonical.parse({ periodType: 'joinedAt', page: '2', pageSize: 'invalid' })).toEqual({
      searched: true,
      page: 2,
    });
    expect(memberListSearch.canonical.parse({ signupMethods: ['direct', 'unknown'] })).toEqual({
      searched: true,
      signupMethods: ['direct'],
    });
  });

  it('resolves defaults once for the screen', () => {
    expect(memberListSearch.resolve({})).toMatchObject({
      page: 1,
      pageSize: 100,
      sortType: 'joinedAt',
      sortDirection: 'desc',
      periodType: 'joinedAt',
      keywords: [],
      searched: false,
    });
  });

  it('lets the definition fix the account status and drop hidden conditions from the request', () => {
    const search = memberListSearch.resolve({ accountStatuses: ['general'], restrictions: ['entry'] });
    expect(toMemberListRequest(search, memberListDefinitions.all)).toMatchObject({
      accountStatuses: ['general'],
      restrictions: ['entry'],
    });
    expect(toMemberListRequest(search, memberListDefinitions.general)).toMatchObject({
      accountStatuses: ['general'],
      restrictions: undefined,
    });
    expect(toMemberListRequest(search, memberListDefinitions.flagged)).toMatchObject({
      accountStatuses: ['flagged'],
      restrictions: ['entry'],
    });
    expect(toMemberListRequest(memberListSearch.resolve({}), memberListDefinitions.all).accountStatuses).toBeUndefined();
  });
});
