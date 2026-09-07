/**
 * 접속 목록의 현재 페이지 선택 상태·컬럼·정렬 옵션과 조건 변경 callback을 조립한다.
 * 실제 API에서도 선택/표시 책임은 필요하다. 현재 타입이 임시 데이터 함수의 반환형에 의존하므로 조회 교체 때 행/페이지 계약으로 분리한다.
 */
import { toggleMemberRecordSort } from "../records/member-record-view";
import { useTranslation } from "react-i18next";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import type { MemberRecordListData } from "../records/member-record-data";
import type { MemberAccessRow } from "../model/member-records";
import { buildMemberAccessListColumns } from "./member-access-columns";
import type { MemberRecordSearch } from "../records/member-record-search";
export function useMemberAccessListResult({
  search,
  data,
  onSearchChange,
}: {
  readonly search: MemberRecordSearch;
  readonly data: MemberRecordListData<MemberAccessRow>;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
}) {
  const { t } = useTranslation("members");
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const onSort = (sortType: NonNullable<MemberRecordSearch["sortType"]>) =>
    onSearchChange(toggleMemberRecordSort(search, sortType));
  const sorts = [
    { value: "accessedAt", label: t("secondary.fields.accessedAt") },
    { value: "email", label: t("columns.email") },
    { value: "name", label: t("columns.name") },
    { value: "phone", label: t("columns.phone") },
    { value: "grade", label: t("columns.grade") },
    { value: "accountStatus", label: t("columns.accountStatus") },
    { value: "accessPath", label: t("secondary.fields.accessPath") },
  ];

  return {
    selectedIds: selection.selectedIds,
    columns: buildMemberAccessListColumns({
      t,
      selection,
      search,
      onSort,
    }),
    sorts,
  };
}
