/**
 * 휴면 목록의 현재 페이지 선택 상태·컬럼·정렬 옵션과 조건 변경 callback을 조립한다.
 * 실제 API에서도 선택/표시 책임은 필요하다. 현재 타입이 임시 데이터 함수의 반환형에 의존하므로 조회 교체 때 행/페이지 계약으로 분리한다.
 */
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import { useTranslation } from "react-i18next";
import type { MemberRecordListData } from "../../../mechanics/record-list/model/member-record-data";
import { toggleMemberRecordSort } from "../../../mechanics/record-list/model/member-record-view";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import type { DormantMemberRow } from "../../../model/member-records";
import { dormantMemberColumns } from "./dormant-member-columns";
export function useDormantMemberListResult({
  search,
  data,
  onSearchChange,
}: {
  search: MemberRecordSearch;
  data: MemberRecordListData<DormantMemberRow>;
  onSearchChange: (next: MemberRecordSearch) => void;
}) {
  const { t } = useTranslation("members");
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const sorts = [
    { value: "joinedAt", label: t("columns.joinedAt") },
    { value: "lastAccessedAt", label: t("columns.lastAccessedAt") },
    { value: "dormantAt", label: t("secondary.fields.dormantAt") },
    { value: "signupMethod", label: t("columns.signupMethod") },
    { value: "email", label: t("columns.email") },
    { value: "name", label: t("columns.name") },
    { value: "phone", label: t("columns.phone") },
  ];
  return {
    sorts,
    selectedIds: selection.selectedIds,
    columns: dormantMemberColumns({
      t,
      selection,
      search,
      onSort: (sortType) =>
        onSearchChange(toggleMemberRecordSort(search, sortType)),
    }),
  };
}
