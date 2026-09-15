import type { useConfirmation } from "@/shared/model/use-confirmation";
import type { useSelectionGate } from "@/shared/model/use-selection-gate";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "./AlertDialog";
import { ConfirmDialog } from "./ConfirmDialog";

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
