import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { Select } from "@/shared/ui/primitives/Select";
import { Button } from "@/shared/ui/primitives/Button";
import { AlertDialog } from "@/shared/ui/patterns/AlertDialog";

export interface ReissuePrinter {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly busy: boolean;
}
export interface ReissueInput {
  readonly printerId: string;
  readonly test: boolean;
}
export function ReissueDialog({
  printers,
  preview,
  onClose,
  onRequest,
}: {
  readonly printers: readonly ReissuePrinter[];
  readonly preview: ReactNode;
  readonly onClose: () => void;
  readonly onRequest: (input: ReissueInput) => void;
}) {
  const { t } = useTranslation("members");
  const { t: shared } = useTranslation("shared");
  const [printerId, setPrinterId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const request = (test: boolean) => {
    const printer = printers.find((item) => item.id === printerId);
    if (!printer?.enabled) return;
    if (printer.busy) {
      setBusy(true);
      return;
    }
    onRequest({ printerId: printer.id, test });
  };
  return (
    <>
      <Dialog
        open
        title={t("secondary.reissue")}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        closeLabel={shared("formAction.cancel")}
      >
        <Select
          aria-label={t("secondary.printer")}
          value={printerId}
          onValueChange={setPrinterId}
          placeholder={t("secondary.choose")}
          options={printers
            .filter((printer) => printer.enabled && !printer.busy)
            .map((printer) => ({ value: printer.id, label: printer.name }))}
        />
        <h2>{t("secondary.preview")}</h2>
        {preview}
        <Button disabled={printerId === null} onClick={() => request(true)}>
          {t("secondary.testPrint")}
        </Button>
        <Button disabled={printerId === null} onClick={() => request(false)}>
          {t("secondary.startPrint")}
        </Button>
        <Button onClick={onClose}>{shared("formAction.cancel")}</Button>
      </Dialog>
      <AlertDialog
        open={busy}
        onOpenChange={setBusy}
        title={shared("alert.title")}
        description={t("secondary.printerBusy")}
        acknowledgeLabel={shared("formSave.confirm")}
      />
    </>
  );
}
