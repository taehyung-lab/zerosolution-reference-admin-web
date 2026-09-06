import { useTranslation } from "react-i18next";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import type { accessData } from "../records/member-record-data";
import { buildMemberAccessListColumns } from "./member-access-columns";
import type { MemberRecordSearch } from "../records/member-record-search";
export function useMemberAccessListResult({
  search,
  data,
  onSearchChange,
}: {
  readonly search: MemberRecordSearch;
  readonly data: ReturnType<typeof accessData>;
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
    viewControls: { search, onChange: onSearchChange, sortOptions: sorts },
    pagination: {
      page: data.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) => onSearchChange({ ...search, page }),
    },
  };
}
