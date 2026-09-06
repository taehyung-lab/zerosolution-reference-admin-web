import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { counselData } from "../records/member-record-data";
import type { MemberRecordSearch } from "../records/member-record-search";
import { MemberCounselListFilters } from "./MemberCounselListFilters";
import { MemberCounselListResult } from "./MemberCounselListResult";
import { useMemberCounselListResult } from "./useMemberCounselListResult";
import {
  MemberDownloadAction,
  type MemberDownloadRequest,
} from "../records/MemberDownloadAction";
export function MemberCounselListScreen({
  search,
  onSearchChange,
  onActivate,
  onDownload,
  inquiryOptions,
}: {
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly onActivate: (id: string) => void;

  readonly onDownload: (request: MemberDownloadRequest) => void;

  readonly inquiryOptions: readonly { value: string; label: string }[];
}) {
  const { t } = useTranslation("members");
  const data = counselData(search);
  const result = useMemberCounselListResult({
    data,
    search,
    onSearchChange,
    inquiryOptions,
  });
  return (
    <section>
      <PageHeader title={t("secondary.counsel")} />
      <MemberCounselListFilters
        search={search}
        onSearchChange={onSearchChange}
        inquiryOptions={inquiryOptions}
      />
      <MemberCounselListResult
        data={data}
        result={result}
        search={search}
        onSearchChange={onSearchChange}
        onActivate={onActivate}
        toolbarRight={
          <MemberDownloadAction
            ids={result.selectedIds}
            search={search}
            onDownload={onDownload}
          />
        }
      />
    </section>
  );
}
