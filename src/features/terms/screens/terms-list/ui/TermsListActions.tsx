import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialog } from '@/shared/ui/dialog/AlertDialog';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import {
  parseTermsBulkChange,
  termsBulkChanges,
  termsBulkChangeValue,
  useTermsListActions,
} from '../model/useTermsListActions';

/**
 * Figma 11.2.1 결과 toolbar 우측: `선택 ▾` + `변경` · `선택복사` · `등록`.
 * 일괄변경은 원문의 3단계를 그대로 돈다 — 미선택 오류 alert(`변경할 항목을 선택해주세요.`) → 확인 alert
 * (`선택 항목을 변경하시겠습니까?`) → 완료 alert(`변경되었습니다.`). 완료를 확인하면 선택이 풀리고,
 * 무효화된 조회가 바뀐 상태를 다시 그린다(`확인 : alert 닫히고, 변경 상태로 화면 갱신됨`).
 * 선택복사는 원문이 미선택 오류 alert 하나만 적어 확인·완료 없이 훅에서 끝난다(TERMS-LIST 미확인 4).
 * alert·확인창의 수명은 늘 mount 되는 이 컴포넌트가 소유해 조회 상태가 바뀌어도 열린 팝업이 사라지지 않는다.
 */
export function TermsListActions({
  selectedIds,
  onChanged,
  onCreate,
}: {
  readonly selectedIds: readonly string[];
  readonly onChanged: () => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('terms');
  const { t: shared } = useTranslation('shared');
  const actions = useTermsListActions(selectedIds);
  const [completed, setCompleted] = useState(false);
  const confirmation = useConfirmation({
    run: async (request: Parameters<typeof actions.runBulkChange>[0]) => {
      await actions.runBulkChange(request);
      setCompleted(true);
    },
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
          aria-label={t('terms.result.bulkField')}
          className="w-52"
          placeholder={t('terms.result.bulkPlaceholder')}
          value={actions.target === undefined ? null : termsBulkChangeValue(actions.target)}
          options={termsBulkChanges.map((change) => ({
            value: termsBulkChangeValue(change),
            label: t(`terms.values.status.${change.value}`),
          }))}
          onValueChange={(value) => actions.setTarget(parseTermsBulkChange(value))}
        />
        <Button onClick={requestBulkChange}>{t('terms.result.bulkChange')}</Button>
        <Button
          className="bg-white text-neutral-900 ring-1 ring-neutral-300"
          onClick={actions.requestCopy}
        >
          {t('terms.result.copy')}
        </Button>
        <Button onClick={onCreate}>{t('terms.result.create')}</Button>
      </div>
      <SelectionAlert controller={actions.gate} />
      {confirmation.dialog}
      <AlertDialog
        open={completed}
        onOpenChange={(open) => {
          if (!open) setCompleted(false);
        }}
        title={shared('alert.title')}
        description={shared('bulkAction.completed')}
        acknowledgeLabel={shared('bulkAction.acknowledge')}
        onAcknowledge={onChanged}
      />
    </>
  );
}
