/** 제품 목록 조회만 실행하고 Query 상태를 결과 화면까지 그대로 전달한다. 옵션은 수명이 달라 별도 훅이 소유한다. */
import { useListQuery } from "@/api/list-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { toTotalPages } from "@/shared/lib/search";
import { managerDirectoryQuery } from "../../../api/directory-queries";
import { type ResolvedManagerListSearch } from "./manager-list-search";
// TRANSPLANT_PENDING_MANAGER_DIRECTORY_QUERY: 제품 OpenAPI 확정 후 queryFn과 응답 매핑을 교체한다.
export function useManagerDirectoryData(search: ResolvedManagerListSearch, searched: boolean) {
  const { locale } = useLocale();
  const data = useListQuery({
    options: managerDirectoryQuery(locale, search),
    searched,
    select: (page) => page,
  });
  return {
    ...data,
    totalPages: toTotalPages(data.total, search.pageSize),
    page: search.page,
  };
}
