/**
 * 보기 조건 변경 시 첫 페이지로 돌아가고, 페이지 이동 시 다른 조건을 보존하는 순수 전이 함수다.
 * 실제 API에서도 필요한 URL/조회 조건 정책이다. 서버의 페이지 응답 계산과 구분한다.
 */
import type { MemberSearch } from "../../../model/member-search";

export function changeMemberListView(
  search: MemberSearch,
  patch: Partial<MemberSearch>,
): MemberSearch {
  return { ...search, ...patch, page: 1 };
}

export function changeMemberListPage(
  search: MemberSearch,
  page: number,
): MemberSearch {
  return { ...search, page };
}
