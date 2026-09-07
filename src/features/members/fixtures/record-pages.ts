/** 서버 페이지 응답을 흉내 내는 mock 계산이다. 실제 API 연결 시 테스트에만 남기고 queryFn을 교체한다. */
import { matchesMemberRecordSearch, memberRecordFixtures, sortMemberRecords } from './member-records';
import type { MemberRecordSearch } from '../records/member-record-search';

/** 예시 배열의 정렬·페이지 분할만 재사용한다. 마지막 페이지 보정은 mock 동작이며 서버 정책은 미확정이다. */
function page<T>(rows: readonly T[], search: MemberRecordSearch, defaultSort: keyof T) {
  const sorted = sortMemberRecords(rows, row => {
    const value = row[search.sortType as keyof T] ?? row[defaultSort];
    return Array.isArray(value) ? value.join(',') : String(value ?? '');
  }, search.sortDirection);
  const pageSize = search.pageSize ?? 100;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(search.page ?? 1, totalPages);
  return { rows: sorted.slice((current - 1) * pageSize, current * pageSize), total: sorted.length, totalPages, page: current };
}

/** 휴면은 가입일, 탈퇴는 탈퇴일을 기본 정렬로 재현한다. */
export function dormantData(search: MemberRecordSearch) {
  return page(memberRecordFixtures().dormant.filter(row => matchesMemberRecordSearch({ ...row }, search)), search, 'joinedAt');
}
export function withdrawnData(search: MemberRecordSearch) {
  return page(memberRecordFixtures().withdrawn.filter(row => matchesMemberRecordSearch({ ...row }, search)), search, 'withdrawnAt');
}
/** 접속과 상담은 각각 접속일·접수일로 예시 결과를 정렬한다. */
export function accessData(search: MemberRecordSearch) {
  return page(memberRecordFixtures().access.filter(row => matchesMemberRecordSearch({ ...row }, search)), search, 'accessedAt');
}
export function counselData(search: MemberRecordSearch) {
  return page(memberRecordFixtures().counsel.filter(row => matchesMemberRecordSearch({ ...row }, search)), search, 'receivedAt');
}
/** 소명만 활동제한 교집합 조건을 추가한다. 이 차이는 범용 검색 설정으로 숨기지 않는다. */
export function appealData(search: MemberRecordSearch) {
  const rows = memberRecordFixtures().appeals.filter(({ restrictions, ...row }) =>
    matchesMemberRecordSearch(row, search) &&
    (!search.restrictions?.length || search.restrictions.some(value => restrictions.includes(value))));
  return page(rows, search, 'appliedAt');
}
