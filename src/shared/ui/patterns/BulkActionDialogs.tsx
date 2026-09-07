import type { useConfirmation } from "@/shared/lib/use-confirmation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "./AlertDialog";
import { ConfirmDialog } from "./ConfirmDialog";

export function useSelectionGate(selectedCount: number) {
  const [message, setMessage] = useState<string>();

  return {
    message,
    requireSelection: (missingSelectionMessage: string) => {
      if (selectedCount > 0) return true;
      setMessage(missingSelectionMessage);
      return false;
    },
    /**
     * Every precheck an action button runs fails the same way, so a caller's other rules
     * (an unfinished cascade value, for example) reject into this alert instead of growing
     * their own inline error state. Returns `false` so a check reads as one `return`.
     */
    reject: (message: string) => {
      setMessage(message);
      return false;
    },
    close: () => setMessage(undefined),
  };
}

export function SelectionAlert({
  controller,
}: {
  readonly controller: ReturnType<typeof useSelectionGate>;
}) {
  const { t } = useTranslation("shared");
  return (
    <AlertDialog
      open={controller.message !== undefined}
      onOpenChange={(open) => {
        if (!open) controller.close();
      }}
      title={t("alert.title")}
      description={controller.message}
      acknowledgeLabel={t("bulkAction.acknowledge")}
    />
  );
}

export function BulkActionDialogs<TValues>({
  controller,
  confirmDescription,
}: {
  readonly controller: ReturnType<typeof useConfirmation<TValues>>;
  readonly confirmDescription: string;
}) {
  const { t } = useTranslation("shared");
  return (
    <ConfirmDialog
      open={controller.state.kind === "confirm"}
      onOpenChange={(open) => {
        if (!open) controller.close();
      }}
      title={t("alert.title")}
      description={confirmDescription}
      confirmLabel={t("bulkAction.acknowledge")}
      cancelLabel={t("bulkAction.cancel")}
      onConfirm={controller.confirm}
    />
  );
}
