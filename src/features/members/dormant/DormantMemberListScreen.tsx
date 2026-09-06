import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { useMemberRecordFilter } from "../records/useMemberRecordFilter";
import type { MemberRecordSearch } from "../records/member-record-search";
import { DormantMemberListFilters } from "./DormantMemberListFilters";
import { DormantMemberListResult } from "./DormantMemberListResult";
import { DormantMemberListActions } from "./DormantMemberListActions";
import { useDormantMemberListData } from "./useDormantMemberListData";
import { useDormantMemberListResult } from "./useDormantMemberListResult";
export function DormantMemberListScreen({
  search,
  onSearchChange,
  onActivate,
  onRegister,
  onMessage,
}: {
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly onActivate: (id: string) => void;
  readonly onRegister: () => void;
  readonly onMessage: (
    channel: "sms" | "email",
    ids: readonly string[],
  ) => void;
}) {
  const { t } = useTranslation("members");
  const filter = useMemberRecordFilter(search, onSearchChange, "joinedAt");
  const data = useDormantMemberListData(search);
  const result = useDormantMemberListResult({ search, data, onSearchChange });
  return (
    <section>
      <PageHeader title={t("secondary.dormant")} />
      <DormantMemberListFilters filter={filter} />
      <DormantMemberListResult
        search={search}
        data={data}
        result={result}
        onSearchChange={onSearchChange}
        onActivate={onActivate}
        actions={
          <DormantMemberListActions
            searched={data.searched}
            selectedIds={result.selectedIds}
            onRegister={onRegister}
            onMessage={onMessage}
          />
        }
      />
    </section>
  );
}
