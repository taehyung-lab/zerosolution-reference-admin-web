import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import { DetailField } from "@/shared/ui/patterns/DetailField";
import { UpdateHistory } from "@/shared/ui/patterns/UpdateHistory";
import {
  MemberActivitySection,
  type MemberActivityRow,
  type MemberActivitySearch,
  type MemberActivityDelete,
} from "../detail/activity/MemberActivitySection";
import { maskMemberEmail } from "../model/member-profile";
import type { WithdrawnMemberRow } from "../model/member-records";
import { formatMemberInstant } from "../model/format-member-instant";

export function WithdrawnMemberDetailScreen({
  member,
  selectActivity,
  onDeleteActivity,
}: {
  readonly member: WithdrawnMemberRow;
  readonly selectActivity: (query: MemberActivitySearch) => {
    rows: readonly MemberActivityRow[];
    total: number;
  };
  readonly onDeleteActivity: (input: MemberActivityDelete) => void;
}) {
  const { t } = useTranslation("members");
  const [query, setQuery] = useState<MemberActivitySearch>({
    tab: "ticket",
    keyword: "",
    page: 1,
    pageSize: 100,
  });
  const activity = selectActivity(query);
  return (
    <>
      <PageHeader title={t("secondary.withdrawnDetail")} />
      <SectionCard title={t("secondary.fields.member")}>
        <dl>
          <DetailField label={t("columns.accountStatus")}>
            {t(`accountStatus.${member.accountStatus}`)}
          </DetailField>
          <DetailField label={t("columns.email")}>
            {maskMemberEmail(member.email)}
          </DetailField>
          <DetailField label={t("columns.joinedAt")}>
            {formatMemberInstant(member.joinedAt)}
          </DetailField>
          <DetailField label={t("columns.signupMethod")}>
            {t(`signup.${member.signupMethod}`)}
          </DetailField>
          <DetailField label={t("secondary.fields.withdrawalDate")}>
            {formatMemberInstant(member.withdrawnAt)}
          </DetailField>
          <DetailField label={t("secondary.fields.reason")}>
            {member.reason}
          </DetailField>
        </dl>
      </SectionCard>
      <SectionCard title={t("activity.title")}>
        <MemberActivitySection
          rows={activity.rows}
          total={activity.total}
          query={query}
          onSearch={setQuery}
          onDelete={onDeleteActivity}
        />
      </SectionCard>
      <SectionCard title={t("detail.history")}>
        <UpdateHistory
          entries={[]}
          labels={{
            date: t("detail.updatedAt"),
            change: t("detail.change"),
            manager: t("counsel.operatorName"),
          }}
          emptyText={t("detail.historyEmpty")}
        />
      </SectionCard>
    </>
  );
}
