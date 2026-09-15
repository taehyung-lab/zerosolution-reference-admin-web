/**
 * 소명 신청의 회원·신청·처리 정보, 처리 폼과 결과 알림을 조립한다.
 * 실제 API에서도 각 surface는 필요하다. 처리 입력과 저장된 결과를 구분하며 API 성공 없이 저장된 결과를 갱신하지 않는다.
 */
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import { UpdateHistory } from "@/shared/ui/patterns/UpdateHistory";
import { Button } from "@/shared/ui/primitives/Button";
import { useTranslation } from "react-i18next";
import type {
  AppealProcessing,
  AppealRecord,
} from "../../../model/appeal-record";
import {
  AppealApplicationSection,
  AppealMemberSection,
  AppealProcessingDetails,
} from "./AppealDetailSections";
import { AppealNotificationAction } from "./AppealNotificationAction";
import { AppealProcessingForm } from "./AppealProcessingForm";

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
          actor: t("counsel.operatorName"),
          }}
          emptyText={t("detail.historyEmpty")}
        />
      </SectionCard>
    </>
  );
}
