import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { appealData } from "../records/member-record-data";
import type { MemberRecordSearch } from "../records/member-record-search";
import { MemberAppealListFilters } from "./MemberAppealListFilters";
import { MemberAppealListResult } from "./MemberAppealListResult";
import { useMemberAppealListResult } from "./useMemberAppealListResult";
import { MemberAppealListActions } from "./MemberAppealListActions";
import { AppealBulkAction, type AppealBulkChange } from "./AppealBulkAction";
export function MemberAppealListScreen({
  search,
  onSearchChange,
  onActivate,
  onMessage,
  onBulkChange,
}: {
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly onActivate: (id: string) => void;

  readonly onMessage: (
    channel: "sms" | "email",
    ids: readonly string[],
  ) => void;

  readonly onBulkChange: (request: AppealBulkChange) => void;
}) {
  const { t } = useTranslation("members");
  const data = appealData(search);
  const result = useMemberAppealListResult({ data, search, onSearchChange });
  return (
    <section>
      <PageHeader title={t("secondary.appeals")} />
      <MemberAppealListFilters
        search={search}
        onSearchChange={onSearchChange}
      />
      <MemberAppealListResult
        data={data}
        result={result}
        search={search}
        onSearchChange={onSearchChange}
        onActivate={onActivate}
        toolbarRight={
          <MemberAppealListActions
            selectedIds={result.selectedIds}
            onMessage={onMessage}
          />
        }
        bulkAction={
          <AppealBulkAction ids={result.selectedIds} onChange={onBulkChange} />
        }
      />
    </section>
  );
}
