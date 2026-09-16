import { useTranslation } from 'react-i18next';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import {
  parsePrinterBulkChange,
  printerBulkChanges,
  printerBulkChangeValue,
  usePrinterListActions,
} from '../model/usePrinterListActions';

/**
 * Figma 결과 toolbar 우측: `선택 ▾` + `변경` · `선택복사` · `등록`.
 * 일괄변경의 확인 lifecycle 과 거절·확인 팝업의 수명은 이 컴포넌트가 소유해 조회 상태가 바뀌어도
 * 열린 팝업이 사라지지 않는다. 선택복사는 확인이 없어 훅에서 바로 끝난다.
 */
export function PrinterListActions({
  selectedIds,
  onCreate,
}: {
  readonly selectedIds: readonly string[];
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('ticketing');
  const { t: shared } = useTranslation('shared');
  const actions = usePrinterListActions(selectedIds);
  const confirmation = useConfirmation({
    run: actions.runBulkChange,
    description: shared('bulkAction.confirm'),
  });
  const requestBulkChange = () => {
    const request = actions.prepareBulkChange();
    if (request !== undefined) confirmation.request(request);
  };

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
        <Button onClick={requestBulkChange}>{t('printer.result.bulkChange')}</Button>
        <Button
          className="bg-white text-neutral-900 ring-1 ring-neutral-300"
          onClick={actions.requestCopy}
        >
          {t('printer.result.copy')}
        </Button>
        <Button onClick={onCreate}>{t('printer.result.create')}</Button>
      </div>
      <SelectionAlert controller={actions.gate} />
      {confirmation.dialog}
    </>
  );
}
