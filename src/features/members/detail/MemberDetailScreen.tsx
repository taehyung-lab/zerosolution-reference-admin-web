import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  displayTimeZone,
  formatDate,
  formatTimeInTimeZone,
} from "@/shared/lib/datetime";
import { DetailField } from "@/shared/ui/patterns/DetailField";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import {
  UpdateHistory,
  type UpdateHistoryEntry,
} from "@/shared/ui/patterns/UpdateHistory";
import { Button } from "@/shared/ui/primitives/Button";
import {
  maskMemberEmail,
  maskMemberPhone,
  type MemberProfile,
} from "../model/member-profile";
import { MemberActionDialog } from "./MemberActionDialog";
import type { MemberDetailActionRequest } from "./member-detail-actions";
import {
  MemberActivitySection,
  type MemberActivityDelete,
  type MemberActivityRow,
  type MemberActivitySearch,
} from "./activity/MemberActivitySection";
import { MemberCounselSection } from "./counsel/MemberCounselSection";
import type {
  MemberCounselInput,
  MemberCounselRecord,
} from "./counsel/member-counsel-schema";

export type MemberDetailRequest =
  | MemberDetailActionRequest
  | {
      readonly kind: "deleteActivity";
      readonly memberId: string;
      readonly input: MemberActivityDelete;
    }
  | {
      readonly kind: "createCounsel";
      readonly memberId: string;
      readonly input: MemberCounselInput;
    }
  | {
      readonly kind: "updateCounsel";
      readonly memberId: string;
      readonly id: string;
      readonly input: MemberCounselInput;
    }
  | {
      readonly kind: "deleteCounsel";
      readonly memberId: string;
      readonly id: string;
    };

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
  readonly activity: {
    readonly rows: readonly MemberActivityRow[];
    readonly total: number;
  };
  readonly activityQuery: MemberActivitySearch;
  readonly onActivitySearch: (search: MemberActivitySearch) => void;
  readonly counsel: readonly MemberCounselRecord[];
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
            {maskMemberEmail(member.email)}
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
            {maskMemberPhone(member.values.phone)}
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
          rows={activity.rows}
          total={activity.total}
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
