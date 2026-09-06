import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/primitives/Button";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { ConfirmDialog } from "@/shared/ui/patterns/ConfirmDialog";
import { DetailField } from "@/shared/ui/patterns/DetailField";
import type { AppealRecord, AppealProcessing } from "./appeal-detail";
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
