import { type MemberDetailRequest } from "../model/member-detail-request";
/**
 * 회원 정보·활동·상담·상세 액션을 조립하고 대상 회원과 입력을 상위 요청에 연결한다.
 * API 연결 후에도 화면 조립은 유지한다. 상세 데이터의 로딩·실패·캐시와 원본 개인정보 조회는 별도 조회 workflow의 책임이다.
 */
import { MemberCounselSection } from "@/features/members/mechanics/counsel-record/ui/MemberCounselSection";
import {
  displayTimeZone,
  formatDate,
  formatTimeInTimeZone,
} from "@/shared/lib/datetime";
import { maskEmail, maskPhone } from "@/shared/lib/mask-contact";
import { DetailField } from "@/shared/ui/patterns/DetailField";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import {
  UpdateHistory,
  type UpdateHistoryEntry,
} from "@/shared/ui/patterns/UpdateHistory";
import { Button } from "@/shared/ui/primitives/Button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MemberActivitySection } from "../../../mechanics/activity/ui/MemberActivitySection";
import { type MemberCounselRecords } from "../../../model/member-counsel-data";
import {
  type MemberActivityData,
  type MemberActivitySearch,
} from "../../../model/member-activity";
import { type MemberProfile } from "../../../model/member-profile";
import { MemberActionDialog } from "./MemberActionDialog";

export function MemberDetailScreen({
  member,
  activity,
  activityQuery,
  onActivitySearch,
  counsel,
  history,
  operatorName,
  onEdit,
  onMessage,
  onRequest,
}: {
  readonly member: MemberProfile;
  readonly activity: MemberActivityData;
  readonly activityQuery: MemberActivitySearch;
  readonly onActivitySearch: (search: MemberActivitySearch) => void;
  readonly counsel: MemberCounselRecords;
  readonly history: readonly UpdateHistoryEntry[];
  readonly operatorName: string;
  readonly onEdit: () => void;
  readonly onMessage: (channel: "sms" | "email") => void;
  readonly onRequest: (request: MemberDetailRequest) => void;
}) {
  const { t } = useTranslation("members");
  const [action, setAction] = useState<"password" | "reveal" | "withdraw">();
  const [openedAt] = useState(() => new Date().toISOString());
  return (
    <section className="space-y-6">
      <PageHeader
        title={t("detail.title")}
        actions={
          <>
            <Button onClick={() => onMessage("sms")}>{t("actions.sms")}</Button>
            <Button onClick={() => onMessage("email")}>
              {t("actions.email")}
            </Button>
          </>
        }
      />
      <SectionCard title={t("form.section")} keepMounted>
        <dl>
          <DetailField label={t("filters.accountStatus")}>
            {t(`accountStatus.${member.values.accountStatus}`)}
          </DetailField>
          {member.values.accountStatus === "flagged" ? (
            <DetailField label={t("filters.restrictions")}>
              {member.values.restrictions
                .map((restriction) => t(`restriction.${restriction}`))
                .join(", ")}
            </DetailField>
          ) : null}
          <DetailField label={t("form.email")}>
            {maskEmail(member.email)}
          </DetailField>
          <DetailField label={t("form.password")}>
            <Button onClick={() => setAction("password")}>
              {t("detailAction.passwordTitle")}
            </Button>
          </DetailField>
          <DetailField label={t("form.name")}>{member.values.name}</DetailField>
          <DetailField label={t("form.birthDate")}>
            {member.values.birthDate}
          </DetailField>
          <DetailField label={t("form.phone")}>
            {maskPhone(member.values.phone)}
          </DetailField>
          <DetailField label={t("columns.joinedAt")}>
            {formatDate(member.joinedAt)}{" "}
            {formatTimeInTimeZone(member.joinedAt, displayTimeZone(), "second")}
          </DetailField>
          <DetailField label={t("columns.signupMethod")}>
            {t(`signup.${member.signupMethod}`)}
          </DetailField>
        </dl>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setAction("reveal")}>
            {t("detailAction.revealTitle")}
          </Button>
          <Button onClick={onEdit}>{t("counsel.edit")}</Button>
          <Button onClick={() => setAction("withdraw")}>
            {t("detailAction.withdrawTitle")}
          </Button>
        </div>
      </SectionCard>
      {action === undefined ? null : (
        <MemberActionDialog
          key={action}
          action={action}
          memberId={member.id}
          onClose={() => setAction(undefined)}
          onRequest={onRequest}
        />
      )}
      <SectionCard title={t("activity.title")} keepMounted>
        <MemberActivitySection
          data={activity}
          query={activityQuery}
          onSearch={onActivitySearch}
          onDelete={(input) =>
            onRequest({ kind: "deleteActivity", memberId: member.id, input })
          }
        />
      </SectionCard>
      <SectionCard title={t("counsel.title")} keepMounted>
        <MemberCounselSection
          records={counsel}
          operatorName={operatorName}
          openedAt={openedAt}
          onCreate={(input) =>
            onRequest({ kind: "createCounsel", memberId: member.id, input })
          }
          onUpdate={(id, input) =>
            onRequest({ kind: "updateCounsel", memberId: member.id, id, input })
          }
          onDelete={(id) =>
            onRequest({ kind: "deleteCounsel", memberId: member.id, id })
          }
        />
      </SectionCard>
      <SectionCard title={t("detail.history")} keepMounted>
        <UpdateHistory
          entries={history}
          labels={{
            date: t("detail.updatedAt"),
            change: t("detail.change"),
            manager: t("counsel.operatorName"),
          }}
          emptyText={t("detail.historyEmpty")}
        />
      </SectionCard>
    </section>
  );
}
