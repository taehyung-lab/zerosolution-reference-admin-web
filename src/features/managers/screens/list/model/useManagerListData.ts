/**
 * 기존 API 목록의 조회 조건·검색 시작 여부·응답 행 변환을 useListQuery에 연결한다.
 * 실제 API에서도 필요한 feature 데이터 훅의 예다. 로딩·오류·재시도를 복제하지 않고 공용 Query 결과를 전달한다.
 */
import { useListQuery } from "@/api/list-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { toTotalPages } from "@/shared/lib/search";
import type { ListResultData } from "@/shared/ui/list/ListResult";
import { managerListQuery } from "../../../api/queries";
import type { ManagerListItem } from "../../../model/manager";
import { toManagerListItem } from "./manager-mapper";
import type { ManagerSearch } from "../../../api/manager-search";

export type ManagerListData = ListResultData<ManagerListItem> & {
  readonly total: number;
  readonly totalPages: number;
};

/**
 * 사용할 조회·검색 시작 조건·행 변환만 소유하고 조회 상태는 useListQuery에 맡긴다.
 */
export function useManagerListData(
  search: ManagerSearch,
  searched: boolean,
): ManagerListData {
  const { locale } = useLocale();
  const list = useListQuery({
    options: managerListQuery(locale, search),
    searched,
    select: (data) => ({
      rows: (data.list ?? []).map(toManagerListItem),
      total: data.totalCount ?? 0,
    }),
  });

  return { ...list, totalPages: toTotalPages(list.total, search.pageSize) };
}
