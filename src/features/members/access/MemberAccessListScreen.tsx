import { accessDataQuery } from "../api/list-queries";
/**
 * 접속 목록의 필터·데이터·결과·업무 액션을 연결하는 화면 조립 컴포넌트다.
 * 실제 API에서도 조립 책임은 유지한다. Query가 예시 응답과 로딩/실패를 전달하며 실제 API에서는 응답 공급 연결부를 교체한다.
 */
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { useMemberRecordFilter } from "../records/useMemberRecordFilter";
import { useMemberRecordListData } from "../records/member-record-data";
import type { MemberRecordSearch } from "../records/member-record-search";
import { MemberAccessListFilters } from "./MemberAccessListFilters";
import { MemberRecordResult } from "../records/MemberRecordResult";
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
  const data = useMemberRecordListData(search, accessDataQuery, search.periodType !== undefined);
  const searched = data.searched;
  const result = useMemberAccessListResult({ search, data, onSearchChange });
  return (
    <section>
      <PageHeader title={t("secondary.access")} />
      <MemberAccessListFilters filter={filter} />
      <MemberRecordResult
        data={data}
        search={search}
        onSearchChange={onSearchChange}
        columns={result.columns}
        sortOptions={result.sorts}
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
