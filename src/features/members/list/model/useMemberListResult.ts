/**
 * 활성 회원의 현재 페이지 선택 상태, 컬럼, 건수 요약과 정렬·페이지 변경 callback을 조립한다.
 * API 연결 후에도 표시·선택 책임은 유지한다. 서버 조회/행 정렬은 수행하지 않으며 Query 데이터는 입력으로 받는다.
 */
import { standardPageSizeOptions } from "@/shared/config/list";
import { useTranslation } from "react-i18next";
import { buildMemberColumns } from "../ui/member-columns";
import type { MemberListDefinition } from "./member-list-definition";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import {
  changeMemberListPage,
  changeMemberListView,
} from "./member-list-policy";
import type { MemberListData } from "./useMemberListData";
import {
  memberSortTypes,
  toMemberRouteSearch,
  type MemberRouteSearch,
  type MemberSearch,
} from "./search-schema";

export function useMemberListResult({
  search,
  data,
  definition,
  onSearchChange,
}: {
  readonly search: MemberSearch;
  readonly data: MemberListData;
  readonly definition: MemberListDefinition;
  readonly onSearchChange: (next: MemberRouteSearch) => void;
}) {
  const { t } = useTranslation("members");
  const applySearch = (next: MemberSearch) =>
    onSearchChange(toMemberRouteSearch(next));

  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.key,
    isSelectable: (row) => row.selectable !== false,
    resetKey: JSON.stringify(toMemberRouteSearch(search)),
  });

  const changeSort = (sortType: MemberSearch["sortType"]) =>
    applySearch(
      changeMemberListView(search, {
        sortType,
        sortDirection:
          search.sortType === sortType
            ? search.sortDirection === "desc" ? "asc" : "desc"
            : search.sortDirection,
      }),
    );


  return {
    selectedIds: selection.selectedIds,
    columns: buildMemberColumns({
      t,
      definition,
      sort: { type: search.sortType, direction: search.sortDirection },
      onSortChange: changeSort,
      selection,
    }),
    pageSize: {
      value: search.pageSize,
      options: standardPageSizeOptions,
      onValueChange: (pageSize: number) =>
        applySearch(
          changeMemberListView(search, {
            pageSize: pageSize as MemberSearch["pageSize"],
          }),
        ),
    },
    sort: {
      value: search.sortType,
      options: memberSortTypes.map((value) => ({
        value,
        label: t(`columns.${value}`),
      })),
      onValueChange: changeSort,
    },
    pagination: {
      page: search.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) =>
        applySearch(changeMemberListPage(search, page)),
    },
  };
}
