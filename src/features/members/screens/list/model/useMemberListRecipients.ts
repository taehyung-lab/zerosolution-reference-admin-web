/**
 * 목록에서 선택한 회원의 발송 수신자를 목록과 같은 Query 응답에서 만든다.
 * 표시 행은 마스킹된 값이라 발송 주소로 쓸 수 없고, 선택은 표시된 페이지에서만 생기므로 같은 페이지 응답이 곧 연락처의 출처다.
 *
 * 값이 아니라 조회 함수를 돌려준다. 발송 의도가 실행되는 순간의 캐시를 읽어야 render 시점의 낡은 연락처를 붙들지 않는다.
 * 필요한 것이 이 한 번의 읽기뿐이라 관찰자를 새로 붙이지 않는다. 조회 실행과 로딩·실패는 목록 화면의 useMemberListData가 소유한다.
 */
import { useLocale } from "@/shared/i18n/locale-context";
import { useQueryClient } from "@tanstack/react-query";
import { memberListQuery } from "../../../api/list-queries";
import {
  memberMessageRecipients,
  memberProfileContact,
  type MemberMessageTarget,
} from "../../../model/member-message";
import { resolveMemberSearch, type MemberRouteSearch } from "./search-schema";

export function useMemberListRecipients(
  routeSearch: MemberRouteSearch,
  variant: "all" | "general" | "flagged",
): (
  channel: "sms" | "email",
  ids: readonly string[],
) => readonly MemberMessageTarget[] {
  const { locale } = useLocale();
  const client = useQueryClient();
  return (channel, ids) => {
    const page = client.getQueryData(
      memberListQuery(
        locale,
        resolveMemberSearch(routeSearch, variant),
        variant,
      ).queryKey,
    );
    return memberMessageRecipients(
      page === undefined ? [] : page.rows.map(memberProfileContact),
      channel,
      ids,
    );
  };
}
