/**
 * 프린터 선택·사용 가능 여부와 테스트/재발행 요청 입력을 다루는 팝업이다.
 * 실제 API에서도 선택 검증은 필요하다. 현재 미리보기와 프린터 예시는 실제 장비 조회·인쇄 성공을 증명하지 않는다.
 */
import { AlertDialog } from "@/shared/ui/patterns/AlertDialog";
import { AsyncFieldBoundary } from "@/shared/ui/patterns/AsyncFieldBoundary";
import { Button } from "@/shared/ui/primitives/Button";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { Select } from "@/shared/ui/primitives/Select";
import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

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
/** 프린터 목록 조회의 사실이다. 조회 실패를 "선택할 프린터가 없음"으로 바꾸지 않는다. */
export interface ReissuePrinting {
  readonly printers: readonly ReissuePrinter[];
  readonly preview: ReactNode;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly onRetry: () => void;
}
export function ReissueDialog({
  printers,
  preview,
  isPending,
  isError,
  onRetry,
  onClose,
  onRequest,
}: ReissuePrinting & {
  readonly onClose: () => void;
  readonly onRequest: (input: ReissueInput) => void;
}) {
  const { t } = useTranslation("members");
  const { t: shared } = useTranslation("shared");
  const printerLabelId = useId();
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
        <span id={printerLabelId}>{t("secondary.printer")}</span>
        <AsyncFieldBoundary
          state={isError ? "error" : isPending ? "loading" : "ready"}
          labelledBy={printerLabelId}
          onRetry={onRetry}
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
        </AsyncFieldBoundary>
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
