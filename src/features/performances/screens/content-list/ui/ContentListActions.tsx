import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { contentUsageStatuses, type ContentUsageStatus } from '@/features/performances/model/content';
import { AlertDialog } from '@/shared/ui/dialog/AlertDialog';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import { useContentListActions } from '../model/useContentListActions';

/**
 * 결과 toolbar 우측: `선택 ▾`(cascade `사용 상태 > 사용 / 사용안함`) + `변경`. 원장 5.1 의 유일한 action 이며
 * 등록은 없다. Notion 3단계를 그대로 돈다 — 미선택 오류 alert → 변경 확인 alert → 변경 완료 alert.
 * 완료를 확인하면 선택이 풀리고 무효화된 조회가 바뀐 상태를 다시 그린다(판정 질문 9).
 * alert·확인창은 조회 상태와 무관하게 늘 mount 되는 이 컴포넌트가 소유한다.
 */
export function ContentListActions({
  selectedIds,
  onChanged,
}: {
  readonly selectedIds: readonly string[];
  readonly onChanged: () => void;
}) {
  const { t } = useTranslation('performances');
  const { t: shared } = useTranslation('shared');
  const actions = useContentListActions(selectedIds);
  const [completed, setCompleted] = useState(false);
  const confirmation = useConfirmation({
    run: async (request: Parameters<typeof actions.runBulkChange>[0]) => {
      await actions.runBulkChange(request);
      setCompleted(true);
    },
    description: shared('bulkAction.confirm'),
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={t('content.bulk.field')}
          className="w-auto"
          value={actions.usageStatus}
          placeholder={t('content.bulk.select')}
          options={contentUsageStatuses.map((value) => ({ value, label: t(`content.options.${value}`) }))}
          onValueChange={(value) => actions.setUsageStatus(value as ContentUsageStatus | null)}
        />
        <Button
          onClick={() => {
            const request = actions.prepareBulkChange(
              shared('bulkAction.missingSelection'),
              t('content.bulk.missingValue'),
            );
            if (request !== undefined) confirmation.request(request);
          }}
        >
          {t('content.bulk.change')}
        </Button>
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
