import type { ResolvedMemberRecordSearch } from "./member-record-search";
/** 회원 기록 목록의 조회 상태·페이지 표시값을 연결한다. 업무별 Query와 검색 시작 정책은 호출부가 정한다. */
import { useListQuery, type ListQueryResult } from "@/api/list-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { toTotalPages } from "@/shared/lib/search";
import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";
import type { MemberRecordSearch } from "../../../model/member-record-search";

export type MemberRecordListData<T> = ListQueryResult<T> & {
  readonly page: number;
  readonly totalPages: number;
};
type RecordPage<T> = { readonly rows: readonly T[]; readonly total: number };

/** 다섯 기록 목록이 같은 결과 모델을 소비하므로 Query 실행과 페이지 계산만 한 곳에서 소유한다. */
export function useMemberRecordListData<
  TPage extends RecordPage<unknown>,
  TKey extends QueryKey,
>(
  search: ResolvedMemberRecordSearch,
  query: (
    locale: string,
    search: MemberRecordSearch,
  ) => UseQueryOptions<TPage, Error, TPage, TKey>,
  searched: boolean,
): MemberRecordListData<TPage["rows"][number]> {
  const { locale } = useLocale();
  const data = useListQuery<TPage, TPage["rows"][number], TKey>({
    options: query(locale, search),
    searched,
    select: (page) => page,
  });
  const totalPages = toTotalPages(data.total, search.pageSize);
  return { ...data, totalPages, page: Math.min(search.page, totalPages) };
}
