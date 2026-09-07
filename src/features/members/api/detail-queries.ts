/** 상세 mock 응답의 Query 선언이다. 서버 DTO·상태가 확정되면 응답 공급 함수를 교체한다. */
import { queryOptions } from '@tanstack/react-query';
import { localizedQueryKey } from '@/api/query-key';
import { blockingProgress, contentProgress, inlineProgress } from '@/api/query-meta';
import { ApiError } from '@/api/error';
import { findMemberFixture, memberCounselFixtures, selectMemberActivityFixture } from '../fixtures/members';
import { memberRecordFixtures, appealDetailFixture, counselDetailFixture, reissueInputFixture } from '../fixtures/member-records';
import type { MemberActivitySearch } from '../detail/activity/MemberActivitySection';

/** mock에서 찾지 못한 ID는 단건의 명시적 not-found로 전달한다. 빈 객체를 정상 상세로 만들지 않는다. */
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new ApiError({ kind: 'not-found', message: '예시 조회 대상이 없습니다.' });
  return value;
}
export function memberDetailQuery(locale: string, id: string) {
  return queryOptions({ queryKey: localizedQueryKey(locale, 'members', 'detail', id), queryFn: () => Promise.resolve().then(() => required(findMemberFixture(id))), ...blockingProgress });
}
export function withdrawnDetailQuery(locale: string, id: string) {
  return queryOptions({ queryKey: localizedQueryKey(locale, 'members', 'withdrawn-detail', id), queryFn: () => Promise.resolve().then(() => required(memberRecordFixtures().withdrawn.find(row => row.id === id))), ...blockingProgress });
}
export function appealDetailQuery(locale: string, id: string) {
  return queryOptions({ queryKey: localizedQueryKey(locale, 'members', 'appeal-detail', id), queryFn: () => Promise.resolve().then(() => required(appealDetailFixture(id))), ...blockingProgress });
}
/** 상세 안의 페이지 목록이다. 상세 진입은 memberDetailQuery가 막으므로 탭·검색·페이지 요청은 content로 둔다. */
export function memberActivityQuery(locale: string, memberId: string, search: MemberActivitySearch) {
  return queryOptions({ queryKey: [...localizedQueryKey(locale, 'members', 'activity', memberId), search], queryFn: () => Promise.resolve().then(() => selectMemberActivityFixture(memberId, search)), ...contentProgress });
}
/** 상세 상담 절의 기록이다. 예시가 회원별로 갈라지지 않지만 캐시 주소는 대상 회원으로 잡는다. */
export function memberCounselRecordsQuery(locale: string, memberId: string) {
  return queryOptions({ queryKey: localizedQueryKey(locale, 'members', 'counsel-records', memberId), queryFn: () => Promise.resolve().then(() => memberCounselFixtures), ...contentProgress });
}
/** 재발행 팝업의 프린터 목록과 미리보기다. 조회 자체는 필드 안에 머물러야 하므로 진입 overlay를 열지 않는다. */
export function counselReissueInputQuery(locale: string) {
  return queryOptions({ queryKey: localizedQueryKey(locale, 'members', 'counsel-reissue-input'), queryFn: () => Promise.resolve().then(() => reissueInputFixture()), ...inlineProgress });
}
export function counselDetailQuery(locale: string, id: string | undefined) {
  return queryOptions({ queryKey: [...localizedQueryKey(locale, 'members', 'counsel-detail'), id], enabled: id !== undefined, queryFn: () => Promise.resolve().then(() => required(id === undefined ? undefined : counselDetailFixture(id))), ...blockingProgress });
}
