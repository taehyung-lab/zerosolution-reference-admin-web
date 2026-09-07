/**
 * 상세 안 활동 목록의 조회를 실행한다. 탭·검색·페이지 상태는 호출 화면이 소유하고 여기서는 그 조건으로 조회만 한다.
 * 목록이므로 빈 페이지는 결과이며 오류가 아니다. 판정은 공용 useListQuery가 소유한다.
 */
import { useListQuery } from "@/api/list-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { memberActivityQuery } from "./detail-queries";
import type { MemberActivitySearch } from "../model/member-activity";

export function useMemberActivity(
  memberId: string,
  search: MemberActivitySearch,
) {
  const { locale } = useLocale();
  return useListQuery({
    options: memberActivityQuery(locale, memberId, search),
    searched: true,
    select: (page) => page,
  });
}
