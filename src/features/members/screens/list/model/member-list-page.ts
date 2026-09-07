/**
 * 회원 목록 페이지 응답을 화면이 읽는 사실로 바꾸는 feature 매핑이다.
 * 조회 시작 여부와 행 표시값은 응답 공급자가 아니라 이 feature가 소유한다. 서버 응답이 연결돼도 이 변환은 그대로 남는다.
 */
import { i18n } from "@/shared/i18n/i18n";
import { maskEmail, maskPhone } from "@/shared/lib/mask-contact";
import { formatMemberInstant } from "../../../lib/format-member-instant";
import type { MemberProfile } from "../../../model/member-profile";
import type { MemberListRow } from "./member-row";
import type { MemberRouteSearch } from "./search-schema";

/**
 * 확인된 명시 검색 목록이라 기간 기준이 URL에 확정된 뒤에만 조회한다.
 * Query 활성화와 결과 상태가 같은 사실을 읽도록 판정은 여기 한 곳만 둔다.
 */
export function memberListSearched(routeSearch: MemberRouteSearch): boolean {
  return routeSearch.periodType !== undefined;
}

/**
 * 목록 셀은 표시 전용이다. 연락처는 마스킹된 표시값이므로 발송 주소로 되돌릴 수 없다.
 * TRANSPLANT_PENDING_MEMBER_LIST_CONTRACT: grade는 확인된 등급 계약이 없어 자리표시자 문자다.
 */
export function toMemberListRow(member: MemberProfile): MemberListRow {
  return {
    key: member.id,
    grade: "—",
    signupMethod: i18n.t(`members:signup.${member.signupMethod}`),
    email: maskEmail(member.email),
    name: member.values.name,
    phone: maskPhone(member.values.phone),
    accountStatus: i18n.t(
      `members:accountStatus.${member.values.accountStatus}`,
    ),
    joinedAt: formatMemberInstant(member.joinedAt),
    lastAccessedAt: formatMemberInstant(member.lastAccessedAt),
    restrictions: member.values.restrictions.map((restriction) =>
      i18n.t(`members:restriction.${restriction}`),
    ),
  };
}
