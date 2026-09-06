import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { useMemberRecordFilter } from "../records/useMemberRecordFilter";
import { accessData } from "../records/member-record-data";
import type { MemberRecordSearch } from "../records/member-record-search";
import { MemberAccessListFilters } from "./MemberAccessListFilters";
import { MemberAccessListResult } from "./MemberAccessListResult";
import { useMemberAccessListResult } from "./useMemberAccessListResult";
import { MemberAccessListActions } from "./MemberAccessListActions";
import type { MemberDownloadRequest } from "../records/MemberDownloadAction";
export function MemberAccessListScreen({
  search,
  onSearchChange,
  onRegister,
  onDownload,
}: {
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;

  readonly onRegister: () => void;

  readonly onDownload: (request: MemberDownloadRequest) => void;
}) {
  const { t } = useTranslation("members");
  const filter = useMemberRecordFilter(search, onSearchChange, "accessedAt");
  const data = accessData(search);
  const searched = search.periodType !== undefined;
  const result = useMemberAccessListResult({ search, data, onSearchChange });
  return (
    <section>
      <PageHeader title={t("secondary.access")} />
      <MemberAccessListFilters filter={filter} />
      <MemberAccessListResult
        data={data}
        searched={searched}
        result={result}
        toolbarRight={
          <MemberAccessListActions
            searched={searched}
            selectedIds={result.selectedIds}
            search={search}
            onRegister={onRegister}
            onDownload={onDownload}
          />
        }
      />
    </section>
  );
}
