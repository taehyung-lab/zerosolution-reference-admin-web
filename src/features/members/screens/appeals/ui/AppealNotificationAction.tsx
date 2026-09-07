/**
 * 저장된 소명 처리 결과를 기준으로 결과 알림 요청을 확인하는 액션이다.
 * API 이후에도 작성 중인 값과 저장 결과를 구분해야 하며, 발송 완료 여부는 실제 요청 응답의 책임이다.
 */
import { ConfirmDialog } from "@/shared/ui/patterns/ConfirmDialog";
import { DetailField } from "@/shared/ui/patterns/DetailField";
import { Button } from "@/shared/ui/primitives/Button";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  AppealProcessing,
  AppealRecord,
} from "../../../model/appeal-record";
export function AppealNotificationAction({
  record,
  onNotify,
}: {
  readonly record: AppealRecord;
  readonly onNotify: (request: {
    appealId: string;
    processing: AppealProcessing;
  }) => void;
}) {
  const { t } = useTranslation("members");
  const { t: shared } = useTranslation("shared");
  const [notifying, setNotifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Button
        disabled={
          record.notified ||
          !["completed", "rejected"].includes(record.processing.result)
        }
        onClick={() => setNotifying(true)}
      >
        {t("secondary.appeal.notify")}
      </Button>
      <Dialog
        open={notifying}
        title={t("secondary.appeal.notify")}
        onOpenChange={setNotifying}
        closeLabel={shared("formAction.cancel")}
      >
        <dl>
          <DetailField label={t("secondary.fields.result")}>
            {t(`secondary.states.${record.processing.result}`)}
          </DetailField>
          {record.processing.result === "rejected" ? (
            <>
              <DetailField label={t("secondary.appeal.reason")}>
                {record.processing.reason === ""
                  ? t("secondary.choose")
                  : t(`secondary.appeal.${record.processing.reason}`)}
              </DetailField>
              {record.processing.reason === "other" ? (
                <DetailField label={t("secondary.appeal.direct")}>
                  {record.processing.direct}
                </DetailField>
              ) : null}
            </>
          ) : null}
        </dl>
        <Button onClick={() => setConfirming(true)}>
          {t("secondary.send")}
        </Button>
        <Button onClick={() => setNotifying(false)}>
          {shared("formAction.cancel")}
        </Button>
      </Dialog>
      <ConfirmDialog
        open={confirming}
        title={shared("alert.title")}
        description={t("secondary.appeal.confirmNotify")}
        confirmLabel={shared("formSave.confirm")}
        cancelLabel={shared("formSave.cancel")}
        onOpenChange={setConfirming}
        onConfirm={() => {
          setConfirming(false);
          onNotify({ appealId: record.id, processing: record.processing });
        }}
      />
    </>
  );
}
