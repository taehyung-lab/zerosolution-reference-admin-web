import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CounselReissuePrinting } from '@/features/members/api/useCounselOptions';
import { AlertDialog } from '@/shared/ui/dialog/AlertDialog';
import { AsyncFieldBoundary } from '@/shared/ui/feedback/AsyncFieldBoundary';
import { Button } from '@/shared/ui/primitives/Button';
import { Dialog } from '@/shared/ui/primitives/Dialog';
import { Select } from '@/shared/ui/primitives/Select';

/**
 * 티켓재발권 팝업: 프린터 선택(서버 옵션, 실패는 필드 안에서 재시도) · 미리보기 · 테스트 발권 · 발권 시작하기.
 * 발권 중인 프린터는 alert 로 거절한다. 실제 장비 연결·인쇄 성공은 요청 함수 뒤의 사실이다.
 */
export function ReissueDialog({
  printing,
  onClose,
  onRequest,
}: {
  readonly printing: CounselReissuePrinting;
  readonly onClose: () => void;
  readonly onRequest: (input: { readonly printerId: string; readonly test: boolean }) => Promise<unknown>;
}) {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const printerLabelId = useId();
  const [printerId, setPrinterId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const request = (test: boolean) => {
    const printer = printing.printers.find((item) => item.id === printerId);
    if (!printer?.enabled) return;
    if (printer.busy) {
      setBusy(true);
      return;
    }
    void onRequest({ printerId: printer.id, test });
  };

  return (
    <>
      <Dialog
        open
        title={t('reissue.title')}
        closeLabel={shared('formAction.cancel')}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <span id={printerLabelId}>{t('reissue.printer')}</span>
        <AsyncFieldBoundary state={printing.state} labelledBy={printerLabelId} onRetry={printing.retry}>
          <Select
            aria-label={t('reissue.printer')}
            value={printerId}
            onValueChange={setPrinterId}
            placeholder={t('reissue.choose')}
            options={printing.printers
              .filter((printer) => printer.enabled && !printer.busy)
              .map((printer) => ({ value: printer.id, label: printer.name }))}
          />
        </AsyncFieldBoundary>
        <h2>{t('reissue.preview')}</h2>
        <p>{printing.preview}</p>
        <Button disabled={printerId === null} onClick={() => request(true)}>
          {t('reissue.testPrint')}
        </Button>
        <Button disabled={printerId === null} onClick={() => request(false)}>
          {t('reissue.startPrint')}
        </Button>
        <Button onClick={onClose}>{shared('formAction.cancel')}</Button>
      </Dialog>
      <AlertDialog
        open={busy}
        onOpenChange={setBusy}
        title={shared('alert.title')}
        description={t('reissue.printerBusy')}
        acknowledgeLabel={shared('formSave.confirm')}
      />
    </>
  );
}
