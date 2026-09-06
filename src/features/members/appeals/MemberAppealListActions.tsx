import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/primitives/Button";
import {
  SelectionAlert,
  useSelectionGate,
} from "@/shared/ui/patterns/BulkActionDialogs";

export function MemberAppealListActions({
  selectedIds,
  onMessage,
}: {
  readonly selectedIds: readonly string[];
  readonly onMessage: (
    channel: "sms" | "email",
    ids: readonly string[],
  ) => void;
}) {
  const { t } = useTranslation("members");
  const gate = useSelectionGate(selectedIds.length);
  const requestMessage = (channel: "sms" | "email") => {
    if (
      gate.requireSelection(
        t(channel === "sms" ? "actions.smsMissing" : "actions.emailMissing"),
      )
    )
      onMessage(channel, selectedIds);
  };
  return (
    <>
      <SelectionAlert controller={gate} />
      <Button type="button" onClick={() => requestMessage("sms")}>
        {t("actions.sms")}
      </Button>
      <Button type="button" onClick={() => requestMessage("email")}>
        {t("actions.email")}
      </Button>
    </>
  );
}
