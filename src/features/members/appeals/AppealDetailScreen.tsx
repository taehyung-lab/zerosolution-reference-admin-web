import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import { UpdateHistory } from "@/shared/ui/patterns/UpdateHistory";
import { Button } from "@/shared/ui/primitives/Button";
import {
  AppealMemberSection,
  AppealApplicationSection,
  AppealProcessingDetails,
} from "./AppealDetailSections";
import { AppealProcessingForm } from "./AppealProcessingForm";
import { AppealNotificationAction } from "./AppealNotificationAction";
import type { AppealRecord, AppealProcessing } from "./appeal-detail";
export type { AppealRecord, AppealProcessing } from "./appeal-detail";

export function AppealDetailScreen({
  record,
  memberHref,
  onSave,
  onNotify,
  onMessage,
}: {
  readonly record: AppealRecord;
  readonly memberHref: string;
  readonly onSave: (request: {
    appealId: string;
    input: AppealProcessing;
  }) => void;
  readonly onNotify: (request: {
    appealId: string;
    processing: AppealProcessing;
  }) => void;
  readonly onMessage: (channel: "sms" | "email") => void;
}) {
  const { t } = useTranslation("members");

  return (
    <>
      <PageHeader
        title={t("secondary.appealDetail")}
        actions={
          <>
            <Button onClick={() => onMessage("sms")}>{t("actions.sms")}</Button>
            <Button onClick={() => onMessage("email")}>
              {t("actions.email")}
            </Button>
          </>
        }
      />

      <AppealMemberSection record={record} memberHref={memberHref} />
      <AppealApplicationSection record={record} />
      <SectionCard title={t("secondary.appeal.processing")} keepMounted>
        {record.notified ? (
          <AppealProcessingDetails record={record} />
        ) : (
          <AppealProcessingForm
            processing={record.processing}
            onSave={(input) => onSave({ appealId: record.id, input })}
          />
        )}
        <AppealNotificationAction record={record} onNotify={onNotify} />
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
