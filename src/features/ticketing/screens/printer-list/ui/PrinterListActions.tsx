import { useTranslation } from 'react-i18next';
import {
  BulkActionDialogs,
  SelectionAlert,
} from '@/shared/ui/dialog/BulkActionDialogs';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import {
  parsePrinterBulkChange,
  printerBulkChanges,
  printerBulkChangeValue,
  usePrinterListActions,
  type PrinterBulkChangeRequest,
  type PrinterCopyRequest,
} from '../model/usePrinterListActions';

/**
 * Figma 결과 toolbar 우측: `선택 ▾` + `변경` · `선택복사` · `등록`.
 * 확인·거절 팝업의 수명은 이 컴포넌트가 소유해 조회 상태가 바뀌어도 열린 팝업이 사라지지 않는다.
 */
export function PrinterListActions({
  selectedIds,
  onBulkChange,
  onCopy,
  onCreate,
}: {
  readonly selectedIds: readonly string[];
  readonly onBulkChange: (request: PrinterBulkChangeRequest) => void;
  readonly onCopy: (request: PrinterCopyRequest) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('ticketing');
  const { t: shared } = useTranslation('shared');
  const actions = usePrinterListActions({ selectedIds, onBulkChange, onCopy });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={t('printer.result.bulkField')}
          className="w-52"
          placeholder={t('printer.result.bulkPlaceholder')}
          value={actions.target === undefined ? null : printerBulkChangeValue(actions.target)}
          options={printerBulkChanges.map((change) => ({
            value: printerBulkChangeValue(change),
            label: t(`printer.result.bulkOption.${change.field}`, {
              value: t(`printer.values.${change.field}.${change.value}`),
            }),
          }))}
          onValueChange={(value) => actions.setTarget(parsePrinterBulkChange(value))}
        />
        <Button onClick={actions.requestBulkChange}>{t('printer.result.bulkChange')}</Button>
        <Button
          className="bg-white text-neutral-900 ring-1 ring-neutral-300"
          onClick={actions.requestCopy}
        >
          {t('printer.result.copy')}
        </Button>
        <Button onClick={onCreate}>{t('printer.result.create')}</Button>
      </div>
      <SelectionAlert controller={actions.selectionGate} />
      <BulkActionDialogs
        controller={actions.bulk}
        confirmDescription={shared('bulkAction.confirm')}
      />
    </>
  );
}
