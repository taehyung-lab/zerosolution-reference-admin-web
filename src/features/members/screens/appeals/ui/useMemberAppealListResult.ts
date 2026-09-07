/**
 * 소명 목록의 현재 페이지 선택 상태·컬럼·정렬 옵션과 조건 변경 callback을 조립한다.
 * 실제 API에서도 선택/표시 책임은 필요하다. 현재 타입이 임시 데이터 함수의 반환형에 의존하므로 조회 교체 때 행/페이지 계약으로 분리한다.
 */
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import { useTranslation } from "react-i18next";
import type { MemberRecordListData } from "../../../mechanics/record-list/model/member-record-data";
import { toggleMemberRecordSort } from "../../../mechanics/record-list/model/member-record-view";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import type { AppealRow } from "../../../model/member-records";
import { buildAppealColumns } from "./appeal-columns";

export function useMemberAppealListResult({
  data,
  search,
  onSearchChange,
}: {
  readonly data: MemberRecordListData<AppealRow>;
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
}) {
  const { t } = useTranslation("members");
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });

  const sorts = [
    { value: "appliedAt", label: t("secondary.fields.appliedAt") },
    { value: "flaggedAt", label: t("secondary.fields.flaggedAt") },
    { value: "email", label: t("columns.email") },
    { value: "name", label: t("columns.name") },
    { value: "phone", label: t("columns.phone") },
    { value: "restrictions", label: t("filters.restrictions") },
  ];

  const onSort = (sortType: NonNullable<MemberRecordSearch["sortType"]>) =>
    onSearchChange(toggleMemberRecordSort(search, sortType));
  return {
    selectedIds: selection.selectedIds,
    sorts,
    columns: buildAppealColumns({ t, selection, search, onSort }),
  };
}
