import {
  dormantSearchContract,
  dormantSearchSchema,
  resolveMemberRecordSearch,
  type MemberRecordRouteSearch,
} from "../../../mechanics/record-list/model/member-record-search";
import { dormantDataQuery } from "../../../api/list-queries";
/**
 * 휴면 목록의 필터·데이터·결과·업무 액션을 연결하는 화면 조립 컴포넌트다.
 * 실제 API에서도 조립 책임은 유지한다. Query가 예시 응답과 로딩/실패를 전달하며 실제 API에서는 응답 공급 연결부를 교체한다.
 */
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { Button } from "@/shared/ui/primitives/Button";
import { useTranslation } from "react-i18next";
import { useMemberRecordListData } from "../../../mechanics/record-list/model/member-record-data";
import { useMemberRecordFilter } from "../../../mechanics/record-list/model/useMemberRecordFilter";
import { MemberMessageActions } from "../../../mechanics/record-list/ui/MemberMessageActions";
import { MemberRecordResult } from "../../../mechanics/record-list/ui/MemberRecordResult";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import { DormantMemberListFilters } from "./DormantMemberListFilters";
import { useDormantMemberListResult } from "./useDormantMemberListResult";
export function DormantMemberListScreen({
  search: routeSearch,
  onSearchChange: changeSearch,
  onActivate,
  onRegister,
  onMessage,
}: {
  readonly search: MemberRecordRouteSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly onActivate: (id: string) => void;
  readonly onRegister: () => void;
  readonly onMessage: (
    channel: "sms" | "email",
    ids: readonly string[],
  ) => void;
}) {
  const onSearchChange = (next: MemberRecordRouteSearch) =>
    changeSearch(dormantSearchSchema.parse(next));
  const { t } = useTranslation("members");
  const search = resolveMemberRecordSearch(routeSearch, dormantSearchContract);
  const filter = useMemberRecordFilter(
    search,
    onSearchChange,
    dormantSearchContract,
    routeSearch.searched === true,
  );
  const data = useMemberRecordListData(
    search,
    dormantDataQuery,
    routeSearch.searched === true,
  );
  const searched = data.searched;
  const result = useDormantMemberListResult({ search, data, onSearchChange });
  return (
    <section>
      <PageHeader title={t("secondary.dormant")} />
      <DormantMemberListFilters filter={filter} />
      <MemberRecordResult
        search={search}
        data={data}
        columns={result.columns}
        sortOptions={result.sorts}
        onSearchChange={onSearchChange}
        onActivate={onActivate}
        toolbarRight={
          <>
            <Button type="button" onClick={onRegister}>
              {t("actions.register")}
            </Button>
            <MemberMessageActions
              visible={searched}
              selectedIds={result.selectedIds}
              onMessage={onMessage}
            />
          </>
        }
      />
    </section>
  );
}
