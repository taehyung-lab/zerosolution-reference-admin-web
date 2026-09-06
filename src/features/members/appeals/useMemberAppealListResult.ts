import { useTranslation } from "react-i18next";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import { buildAppealColumns } from "./appeal-columns";
import type { appealData } from "../records/member-record-data";
import type { MemberRecordSearch } from "../records/member-record-search";

export function useMemberAppealListResult({
  data,
  search,
  onSearchChange,
}: {
  readonly data: ReturnType<typeof appealData>;
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
    onSearchChange({
      ...search,
      sortType,
      sortDirection:
        search.sortType === sortType && search.sortDirection === "asc"
          ? "desc"
          : "asc",
      page: undefined,
    });
  return {
    selectedIds: selection.selectedIds,
    sorts,
    columns: buildAppealColumns({ t, selection, search, onSort }),
  };
}
