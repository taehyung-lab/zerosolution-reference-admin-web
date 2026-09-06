import { useTranslation } from "react-i18next";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import { dormantMemberColumns } from "./dormant-member-columns";
import type { MemberRecordSearch } from "../records/member-record-search";
import type { useDormantMemberListData } from "./useDormantMemberListData";
export function useDormantMemberListResult({
  search,
  data,
  onSearchChange,
}: {
  search: MemberRecordSearch;
  data: ReturnType<typeof useDormantMemberListData>;
  onSearchChange: (next: MemberRecordSearch) => void;
}) {
  const { t } = useTranslation("members");
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  return {
    selectedIds: selection.selectedIds,
    columns: dormantMemberColumns({
      t,
      selection,
      search,
      onSort: (sortType) =>
        onSearchChange({
          ...search,
          sortType,
          sortDirection:
            search.sortType === sortType && search.sortDirection === "asc"
              ? "desc"
              : "asc",
          page: undefined,
        }),
    }),
  };
}
