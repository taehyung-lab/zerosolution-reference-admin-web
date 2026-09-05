import { describe, expect, it } from 'vitest';
import {
  allMemberCanonicalSearchSchema,
  flaggedMemberCanonicalSearchSchema,
  generalMemberCanonicalSearchSchema,
  memberPageSizes,
  memberCanonicalSearchSchema,
  memberSortTypes,
  resolveMemberSearch,
  toMemberRouteSearch,
} from './search-schema';

describe('member route search', () => {
  it('keeps the confirmed page-size and sort options as one typed fact', () => {
    expect(memberPageSizes).toEqual([100, 200, 300, 400, 500, 700, 1000]);
    expect(memberSortTypes).toEqual([
      'joinedAt',
      'lastAccessedAt',
      'signupMethod',
      'email',
      'name',
      'phone',
    ]);
  });

  it('keeps an empty URL unsearched and supplies resolved defaults after search', () => {
    expect(memberCanonicalSearchSchema.parse({})).toEqual({});
    expect(resolveMemberSearch({ periodType: 'joinedAt' })).toMatchObject({
      page: 1,
      pageSize: 100,
      sortType: 'joinedAt',
      sortDirection: 'desc',
    });
  });

  it('recovers valid values and omits defaults from the committed URL', () => {
    expect(
      memberCanonicalSearchSchema.parse({
        periodType: 'joinedAt',
        page: '2',
        pageSize: 'invalid',
        signupMethods: ['direct', 'unknown'],
      }),
    ).toEqual({
      periodType: 'joinedAt',
      page: 2,
      signupMethods: ['direct'],
    });
    expect(
      toMemberRouteSearch(resolveMemberSearch({ periodType: 'joinedAt' })),
    ).toEqual({ periodType: 'joinedAt' });
  });

  it('removes filters that are not owned by the general and flagged routes', () => {
    const input = {
      periodType: 'joinedAt',
      accountStatuses: ['general'],
      restrictions: ['entry'],
    };
    expect(allMemberCanonicalSearchSchema.parse(input)).toEqual(input);
    expect(generalMemberCanonicalSearchSchema.parse(input)).toEqual({
      periodType: 'joinedAt',
    });
    expect(flaggedMemberCanonicalSearchSchema.parse(input)).toEqual({
      periodType: 'joinedAt',
      restrictions: ['entry'],
    });
  });

  it('drops a reversed instant range while preserving other valid search values', () => {
    expect(
      memberCanonicalSearchSchema.parse({
        periodType: 'lastAccessedAt',
        startDateTime: '2026-09-05T00:00:00.000Z',
        endDateTime: '2026-09-01T00:00:00.000Z',
        page: 2,
      }),
    ).toEqual({ periodType: 'lastAccessedAt', page: 2 });
  });
});
