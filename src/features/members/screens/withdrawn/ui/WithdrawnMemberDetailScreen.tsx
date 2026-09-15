/**
 * 탈퇴 정보와 활동 목록·선택삭제를 표시하는 상세 화면이다.
 * 활동 조회는 탭·검색·페이지 상태를 가진 이 화면이 자기 Query로 실행한다. 비어 있는 업데이트 이력을 실제 없음으로 단정하지 않는다.
 */
import { maskEmail } from "@/shared/lib/mask-contact";
import { DetailField } from "@/shared/ui/patterns/DetailField";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import { UpdateHistory } from "@/shared/ui/patterns/UpdateHistory";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMemberActivity } from "../../../api/useMemberActivity";
import { MemberActivitySection } from "../../../mechanics/activity/ui/MemberActivitySection";
import {
  type MemberActivityDelete,
  type MemberActivitySearch,
} from "../../../model/member-activity";

import { formatMemberInstant } from "../../../lib/format-member-instant";
import type { WithdrawnMemberRow } from "../../../model/member-records";

export function WithdrawnMemberDetailScreen({
  member,
  onDeleteActivity,
}: {
  readonly member: WithdrawnMemberRow;
  readonly onDeleteActivity: (request: {
    memberId: string;
    input: MemberActivityDelete;
  }) => void;
}) {
  const { t } = useTranslation("members");
  const [query, setQuery] = useState<MemberActivitySearch>({
    tab: "ticket",
    keyword: "",
    page: 1,
    pageSize: 100,
  });
  const activity = useMemberActivity(member.id, query);
  return (
    <>
      <PageHeader title={t("secondary.withdrawnDetail")} />
      <SectionCard title={t("secondary.fields.member")}>
        <dl>
          <DetailField label={t("columns.accountStatus")}>
            {t(`accountStatus.${member.accountStatus}`)}
          </DetailField>
          <DetailField label={t("columns.email")}>
            {maskEmail(member.email)}
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
          data={activity}
          query={query}
          onSearch={setQuery}
          onDelete={(input) => onDeleteActivity({ memberId: member.id, input })}
        />
      </SectionCard>
      <SectionCard title={t("detail.history")}>
        <UpdateHistory
          entries={[]}
          labels={{
            date: t("detail.updatedAt"),
            change: t("detail.change"),
          actor: t("counsel.operatorName"),
          }}
          emptyText={t("detail.historyEmpty")}
        />
      </SectionCard>
    </>
  );
}
