import { useTranslation } from "react-i18next";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import { buildCounselColumns } from "./counsel-columns";
import type { counselData } from "../records/member-record-data";
import type { MemberRecordSearch } from "../records/member-record-search";

export function useMemberCounselListResult({
  data,
  search,
  onSearchChange,
  inquiryOptions,
}: {
  readonly data: ReturnType<typeof counselData>;
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly inquiryOptions: readonly { value: string; label: string }[];
}) {
  const { t } = useTranslation("members");
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });

  const sorts = [
    { value: "receivedAt", label: t("secondary.fields.receivedAt") },
    { value: "answeredAt", label: t("secondary.fields.answeredAt") },
    { value: "email", label: t("columns.email") },
    { value: "name", label: t("columns.name") },
    { value: "phone", label: t("columns.phone") },
    { value: "inquiryType", label: t("secondary.fields.inquiryType") },
    { value: "content", label: t("secondary.fields.content") },
    { value: "status", label: t("secondary.fields.status") },
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
    columns: buildCounselColumns({
      t,
      selection,
      search,
      onSort,
      inquiryOptions,
    }),
  };
}
