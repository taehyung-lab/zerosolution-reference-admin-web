/**
 * 기록 목록의 정렬 클릭을 확정 검색 조건 변경으로 바꾸는 순수 함수다.
 * 실제 API에서도 정렬 방향·페이지 초기화는 프런트의 조작 정책이며, 행 배열의 정렬은 이 함수의 책임이 아니다.
 */
import type { MemberRecordSearch } from './member-record-search';

export function toggleMemberRecordSort(
  search: MemberRecordSearch,
  sortType: NonNullable<MemberRecordSearch['sortType']>,
): MemberRecordSearch {
  return {
    ...search,
    sortType,
    sortDirection: search.sortType === sortType && search.sortDirection === 'asc' ? 'desc' : 'asc',
    page: undefined,
  };
}
