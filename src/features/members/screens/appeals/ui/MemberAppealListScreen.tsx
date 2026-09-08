import {
  appealSearchContract,
  appealSearchSchema,
  resolveMemberRecordSearch,
  type MemberRecordRouteSearch,
} from "../../../mechanics/record-list/model/member-record-search";
import { appealDataQuery } from "../../../api/list-queries";
/**
 * 소명 목록의 필터·데이터·결과·업무 액션을 연결하는 화면 조립 컴포넌트다.
 * 실제 API에서도 조립 책임은 유지한다. Query가 예시 응답과 로딩/실패를 전달하며 실제 API에서는 응답 공급 연결부를 교체한다.
 */
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { useTranslation } from "react-i18next";
import { useMemberRecordListData } from "../../../mechanics/record-list/model/member-record-data";
import { MemberMessageActions } from "../../../mechanics/record-list/ui/MemberMessageActions";
import { MemberRecordResult } from "../../../mechanics/record-list/ui/MemberRecordResult";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import { type AppealBulkChange } from "../model/appeal-bulk-change";
import { AppealBulkAction } from "./AppealBulkAction";
import { MemberAppealListFilters } from "./MemberAppealListFilters";
import { useMemberAppealListResult } from "./useMemberAppealListResult";
export function MemberAppealListScreen({
  search: routeSearch,
  onSearchChange: changeSearch,
  onActivate,
  onMessage,
  onBulkChange,
}: {
  readonly search: MemberRecordRouteSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly onActivate: (id: string) => void;

  readonly onMessage: (
    channel: "sms" | "email",
    ids: readonly string[],
  ) => void;

  readonly onBulkChange: (request: AppealBulkChange) => void;
}) {
  const onSearchChange = (next: MemberRecordRouteSearch) =>
    changeSearch(appealSearchSchema.parse(next));
  const { t } = useTranslation("members");
  const search = resolveMemberRecordSearch(routeSearch, appealSearchContract);
  const data = useMemberRecordListData(search, appealDataQuery, true);
  const result = useMemberAppealListResult({ data, search, onSearchChange });
  return (
    <section>
      <PageHeader title={t("secondary.appeals")} />
      <MemberAppealListFilters
        search={search}
        onSearchChange={onSearchChange}
      />
      <MemberRecordResult
        data={data}
        columns={result.columns}
        sortOptions={result.sorts}
        search={search}
        onSearchChange={onSearchChange}
        onActivate={onActivate}
        toolbarRight={
          <MemberMessageActions
            visible
            selectedIds={result.selectedIds}
            onMessage={onMessage}
          />
        }
        beforeResult={
          <AppealBulkAction ids={result.selectedIds} onChange={onBulkChange} />
        }
      />
    </section>
  );
}
