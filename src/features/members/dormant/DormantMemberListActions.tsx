import { useTranslation } from "react-i18next";
import {
  SelectionAlert,
  useSelectionGate,
} from "@/shared/ui/patterns/BulkActionDialogs";
import { Button } from "@/shared/ui/primitives/Button";
export function DormantMemberListActions({
  searched,
  selectedIds,
  onRegister,
  onMessage,
}: {
  searched: boolean;
  selectedIds: readonly string[];
  onRegister: () => void;
  onMessage: (channel: "sms" | "email", ids: readonly string[]) => void;
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
      <Button type="button" onClick={onRegister}>
        {t("actions.register")}
      </Button>
      {searched ? (
        <>
          <Button type="button" onClick={() => requestMessage("sms")}>
            {t("actions.sms")}
          </Button>
          <Button type="button" onClick={() => requestMessage("email")}>
            {t("actions.email")}
          </Button>
        </>
      ) : null}
    </>
  );
}
