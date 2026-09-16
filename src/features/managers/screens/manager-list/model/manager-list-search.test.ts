import { describe, expect, it } from 'vitest';
import { managerListSearch, toManagerListRequest } from './manager-list-search';

const keys = [
  'page',
  'pageSize',
  'sortType',
  'sortDirection',
  'periodType',
  'startDateTime',
  'endDateTime',
  'keywords',
  'types',
  'permission',
  'statuses',
  'registrationRoutes',
].sort();

describe('운영자 목록 검색 계약', () => {
  it('defaults·partition 은 필드를, schema 는 필드 + searched 표식을 선언한다', () => {
    expect(Object.keys(managerListSearch.defaults).sort()).toEqual(keys);
    expect(Object.keys(managerListSearch.partition).sort()).toEqual(keys);
    expect(Object.keys(managerListSearch.schema.shape).sort()).toEqual([...keys, 'searched'].sort());
  });

  it('보기 100 · 정렬 가입일 desc · 기간 기준 가입일 · 빈 다중선택 · 권한 없음이 기본값이다', () => {
    expect(managerListSearch.defaults).toEqual({
      page: 1,
      pageSize: 100,
      sortType: 'joinedAt',
      sortDirection: 'desc',
      periodType: 'joinedAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: [],
      types: [],
      permission: undefined,
      statuses: [],
      registrationRoutes: [],
    });
  });

  it('빈 URL 은 검색 전이고, 조건이 있는 URL 은 검색된 URL 이며, 초기화(searched: false)는 검색 전으로 돌아간다', () => {
    expect(managerListSearch.canonical.parse({})).toEqual({});
    expect(managerListSearch.resolve({}).searched).toBe(false);
    expect(managerListSearch.canonical.parse({ page: 1 })).toEqual({ searched: true });
    expect(managerListSearch.canonical.parse({ statuses: ['rejected', 'inactive'], permission: '1' })).toEqual({
      statuses: ['rejected', 'inactive'],
      permission: '1',
      searched: true,
    });
    expect(
      managerListSearch.canonical.parse({ ...managerListSearch.defaults, statuses: ['active'], searched: false }),
    ).toEqual({});
  });

  it('역전된 기간만 지우고 다른 유효 조건은 남긴다', () => {
    expect(
      managerListSearch.canonical.parse({
        periodType: 'joinedAt',
        permission: '1',
        startDateTime: '2026-09-06T00:00:00Z',
        endDateTime: '2026-09-05T00:00:00Z',
      }),
    ).toEqual({ permission: '1', searched: true });
  });

  it('잘못된 값은 기본값으로 복구하고 인식할 수 없는 배열 항목만 버린다', () => {
    const recovered = managerListSearch.schema.parse({
      page: 'wrong',
      sortType: 'nothing',
      statuses: ['active', 'UNKNOWN'],
      permission: '',
    });
    expect(recovered.page).toBeUndefined();
    expect(recovered.sortType).toBeUndefined();
    expect(recovered.statuses).toEqual(['active']);
    expect(recovered.permission).toBeUndefined();
  });

  it('요청 입력은 빈 배열을 생략하고 선택한 조건만 싣는다', () => {
    expect(toManagerListRequest(managerListSearch.resolve({ statuses: ['active'], page: 2, searched: true }))).toEqual({
      page: 2,
      pageSize: 100,
      sortType: 'joinedAt',
      sortDirection: 'desc',
      periodType: 'joinedAt',
      startDateTime: undefined,
      endDateTime: undefined,
      keywords: undefined,
      types: undefined,
      permission: undefined,
      statuses: ['active'],
      registrationRoutes: undefined,
    });
  });
});
