import { useTranslation } from "react-i18next";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import type { withdrawnData } from "../records/member-record-data";
import { buildWithdrawnMemberListColumns } from "./withdrawn-member-columns";
import type { MemberRecordSearch } from "../records/member-record-search";
export function useWithdrawnMemberListResult({
  search,
  data,
  onSearchChange,
}: {
  readonly search: MemberRecordSearch;
  readonly data: ReturnType<typeof withdrawnData>;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
}) {
  const { t } = useTranslation("members");
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const onSort = (sortType: NonNullable<MemberRecordSearch["sortType"]>) =>
    onSearchChange({
      ...search,
      sortType,
      sortDirection:
        search.sortType === sortType && search.sortDirection === "asc"
          ? "desc"
          : "asc",
      page: undefined,
    });
  const sorts = [
    { value: "withdrawnAt", label: t("secondary.fields.withdrawnAt") },
    { value: "joinedAt", label: t("columns.joinedAt") },
    { value: "signupMethod", label: t("columns.signupMethod") },
    { value: "email", label: t("columns.email") },
    { value: "lastAccessedAt", label: t("columns.lastAccessedAt") },
    { value: "name", label: t("columns.name") },
    { value: "phone", label: t("columns.phone") },
  ];

  return {
    selectedIds: selection.selectedIds,
    columns: buildWithdrawnMemberListColumns({
      t,
      selection,
      search,
      onSort,
    }),
    viewControls: { search, onChange: onSearchChange, sortOptions: sorts },
    pagination: {
      page: data.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) => onSearchChange({ ...search, page }),
    },
  };
}
