import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { useMemberRecordFilter } from "../records/useMemberRecordFilter";
import { withdrawnData } from "../records/member-record-data";
import type { MemberRecordSearch } from "../records/member-record-search";
import { WithdrawnMemberListFilters } from "./WithdrawnMemberListFilters";
import { WithdrawnMemberListResult } from "./WithdrawnMemberListResult";
import { useWithdrawnMemberListResult } from "./useWithdrawnMemberListResult";
import { Button } from "@/shared/ui/primitives/Button";
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
  const data = withdrawnData(search);
  const searched = search.periodType !== undefined;
  const result = useWithdrawnMemberListResult({ search, data, onSearchChange });
  return (
    <section>
      <PageHeader title={t("secondary.withdrawn")} />
      <WithdrawnMemberListFilters filter={filter} />
      <WithdrawnMemberListResult
        data={data}
        searched={searched}
        result={result}
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
