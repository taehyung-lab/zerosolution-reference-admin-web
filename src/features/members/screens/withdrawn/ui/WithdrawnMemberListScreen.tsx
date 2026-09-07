import { withdrawnDataQuery } from "../../../api/list-queries";
/**
 * 탈퇴 목록의 필터·데이터·결과·업무 액션을 연결하는 화면 조립 컴포넌트다.
 * 실제 API에서도 조립 책임은 유지한다. Query가 예시 응답과 로딩/실패를 전달하며 실제 API에서는 응답 공급 연결부를 교체한다.
 */
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { Button } from "@/shared/ui/primitives/Button";
import { useTranslation } from "react-i18next";
import { useMemberRecordListData } from "../../../mechanics/record-list/model/member-record-data";
import { useMemberRecordFilter } from "../../../mechanics/record-list/model/useMemberRecordFilter";
import { MemberRecordResult } from "../../../mechanics/record-list/ui/MemberRecordResult";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import { useWithdrawnMemberListResult } from "./useWithdrawnMemberListResult";
import { WithdrawnMemberListFilters } from "./WithdrawnMemberListFilters";
export function WithdrawnMemberListScreen({
  search,
  onSearchChange,
  onActivate,
  onRegister,
}: {
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly onActivate: (id: string) => void;
  readonly onRegister: () => void;
}) {
  const { t } = useTranslation("members");
  const filter = useMemberRecordFilter(search, onSearchChange, "joinedAt");
  const data = useMemberRecordListData(
    search,
    withdrawnDataQuery,
    search.periodType !== undefined,
  );
  const result = useWithdrawnMemberListResult({ search, data, onSearchChange });
  return (
    <section>
      <PageHeader title={t("secondary.withdrawn")} />
      <WithdrawnMemberListFilters filter={filter} />
      <MemberRecordResult
        data={data}
        search={search}
        onSearchChange={onSearchChange}
        columns={result.columns}
        sortOptions={result.sorts}
        onActivate={onActivate}
        toolbarRight={
          <Button type="button" onClick={onRegister}>
            {t("actions.register")}
          </Button>
        }
      />
    </section>
  );
}
