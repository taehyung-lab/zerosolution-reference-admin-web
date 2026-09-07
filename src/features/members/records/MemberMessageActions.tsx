/**
 * 선택한 회원에게 SMS·이메일 작성 요청을 보내는 버튼과 미선택 알림이다.
 * 선택 검증은 API 연결 후에도 유지하며, 주소 조회와 실제 발송은 호출자가 연결한 업무 흐름의 책임이다.
 */
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/primitives/Button";
import {
  SelectionAlert,
  useSelectionGate,
} from "@/shared/ui/patterns/BulkActionDialogs";

export function MemberMessageActions({
  visible,
  selectedIds,
  onMessage,
}: {
  readonly visible: boolean;
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
      {visible ? (
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
