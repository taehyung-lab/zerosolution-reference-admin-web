import { counselDataQuery } from "../api/list-queries";
/**
 * 상담 목록의 필터·데이터·결과·업무 액션을 연결하는 화면 조립 컴포넌트다.
 * 실제 API에서도 조립 책임은 유지한다. Query가 예시 응답과 로딩/실패를 전달하며 실제 API에서는 응답 공급 연결부를 교체한다.
 */
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { useMemberRecordListData } from "../records/member-record-data";
import type { MemberRecordSearch } from "../records/member-record-search";
import { MemberCounselListFilters } from "./MemberCounselListFilters";
import { MemberRecordResult } from "../records/MemberRecordResult";
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
  const data = useMemberRecordListData(search, counselDataQuery, true);
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
      <MemberRecordResult
        data={data}
        columns={result.columns}
        sortOptions={result.sorts}
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
