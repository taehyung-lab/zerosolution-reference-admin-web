import { describe, expect, it } from 'vitest';
import { readManagerListPage } from '@/features/managers/fixtures/managers';
import { managerListSearch, toManagerListRequest } from '@/features/managers/screens/manager-list/model/manager-list-search';
import { readAccessListPage } from '@/features/members/fixtures/member-records';
import { accessListSearch, toAccessListRequest } from '@/features/members/screens/member-access-list/model/access-list-search';
import { appealListSearch } from '@/features/members/screens/member-appeal-list/model/appeal-list-search';
import { counselListSearch } from '@/features/members/screens/member-counsel-list/model/counsel-list-search';
import { dormantListSearch } from '@/features/members/screens/member-dormant-list/model/dormant-list-search';
import { memberListSearch } from '@/features/members/screens/member-list/model/member-list-search';
import { withdrawnListSearch } from '@/features/members/screens/member-withdrawn-list/model/withdrawn-list-search';
import { performanceListSearch } from '@/features/performances/screens/performance-list/model/performance-list-search';

/** 검색 전 상태를 가진 목록(`true`)은 유효한 조건이 남으면 `searched` 표식을 함께 쓴다. */
const schemas = [
  ['manager', managerListSearch.canonical, true],
  ['member', memberListSearch.canonical, true],
  ['dormant', dormantListSearch.canonical, true],
  ['withdrawn', withdrawnListSearch.canonical, true],
  ['access', accessListSearch.canonical, true],
  ['counsel', counselListSearch.canonical, false],
  ['appeal', appealListSearch.canonical, false],
  ['performance', performanceListSearch.canonical, false],
] as const;

describe.each(schemas)('%s closed search', (_name, schema, explicit) => {
  const marker = explicit ? { searched: true } : {};
  it.each([
    { startDateTime: '2026-09-01T00:00:00Z' },
    { endDateTime: '2026-09-01T00:00:00Z' },
    { startDateTime: 'wrong', endDateTime: '2026-09-01T00:00:00Z' },
    { startDateTime: '2026-09-01T00:00:00Z', endDateTime: 'wrong' },
    { startDateTime: '2026-09-02T00:00:00Z', endDateTime: '2026-09-01T00:00:00Z' },
  ])('clears invalid pairs, not valid unrelated fields: %j', (range) => {
    expect(schema.parse(range)).toEqual({});
    expect(schema.parse({ ...range, pageSize: 200 })).toEqual({ ...marker, pageSize: 200 });
    expect(schema.parse({ ...range, ...marker })).toEqual(marker);
  });
  it.each(['2026-09-01T00:00:00Z', '2026-09-01T00:00:00.100Z'])('preserves equal/ordered instants with end %s', (endDateTime) => {
    const range = { startDateTime: '2026-09-01T00:00:00Z', endDateTime };
    const canonical = schema.parse(range);
    expect(canonical).toEqual({ ...range, ...marker });
    expect(schema.parse(canonical)).toEqual(canonical);
  });
});

it('uses instant comparison in the manager URL-to-fixture workflow', async () => {
  const request = toManagerListRequest(
    managerListSearch.resolve(
      managerListSearch.canonical.parse({ startDateTime: '2026-08-01T00:00:00Z', endDateTime: '2026-08-01T00:00:00.100Z' }),
    ),
  );
  expect((await readManagerListPage(request)).total).toBeGreaterThan(0);
  expect((await readManagerListPage({ ...request, startDateTime: '2026-08-01T00:00:00.001Z' })).total).toBe(0);
});

it('uses instant comparison in the member access URL-to-fixture workflow', async () => {
  const request = toAccessListRequest(
    accessListSearch.resolve(
      accessListSearch.canonical.parse({ startDateTime: '2026-09-01T00:00:00Z', endDateTime: '2026-09-01T00:00:00.100Z' }),
    ),
  );
  expect((await readAccessListPage(request)).total).toBe(101);
  expect((await readAccessListPage({ ...request, startDateTime: '2026-09-01T00:00:00.001Z' })).total).toBe(0);
});
