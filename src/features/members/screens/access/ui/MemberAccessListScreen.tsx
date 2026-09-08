import {
  accessSearchContract,
  accessSearchSchema,
  resolveMemberRecordSearch,
  type MemberRecordRouteSearch,
} from "../../../mechanics/record-list/model/member-record-search";
import { accessDataQuery } from "../../../api/list-queries";
/**
 * 접속 목록의 필터·데이터·결과·업무 액션을 연결하는 화면 조립 컴포넌트다.
 * 실제 API에서도 조립 책임은 유지한다. Query가 예시 응답과 로딩/실패를 전달하며 실제 API에서는 응답 공급 연결부를 교체한다.
 */
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { useTranslation } from "react-i18next";
import type { MemberDownloadRequest } from "../../../mechanics/record-list/model/member-download";
import { useMemberRecordListData } from "../../../mechanics/record-list/model/member-record-data";
import { useMemberRecordFilter } from "../../../mechanics/record-list/model/useMemberRecordFilter";
import { MemberRecordResult } from "../../../mechanics/record-list/ui/MemberRecordResult";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import { MemberAccessListActions } from "./MemberAccessListActions";
import { MemberAccessListFilters } from "./MemberAccessListFilters";
import { useMemberAccessListResult } from "./useMemberAccessListResult";
export function MemberAccessListScreen({
  search: routeSearch,
  onSearchChange: changeSearch,
  onRegister,
  onDownload,
}: {
  readonly search: MemberRecordRouteSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;

  readonly onRegister: () => void;

  readonly onDownload: (request: MemberDownloadRequest) => void;
}) {
  const onSearchChange = (next: MemberRecordRouteSearch) =>
    changeSearch(accessSearchSchema.parse(next));
  const { t } = useTranslation("members");
  const search = resolveMemberRecordSearch(routeSearch, accessSearchContract);
  const filter = useMemberRecordFilter(
    search,
    onSearchChange,
    accessSearchContract,
    routeSearch.searched === true,
  );
  const data = useMemberRecordListData(
    search,
    accessDataQuery,
    routeSearch.searched === true,
  );
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
