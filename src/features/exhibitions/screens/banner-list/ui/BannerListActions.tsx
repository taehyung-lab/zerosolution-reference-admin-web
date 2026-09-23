import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialog } from '@/shared/ui/dialog/AlertDialog';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import {
  bannerBulkChanges,
  bannerBulkChangeValue,
  parseBannerBulkChange,
  useBannerListActions,
} from '../model/useBannerListActions';
import { BannerPreviewDialog } from './BannerPreviewDialog';

/**
 * Figma 7.1.1.1 결과 toolbar 우측: `선택 ▾` + `변경` | `미리보기` · `등록`.
 * 일괄변경은 원문의 3단계를 그대로 돈다 — 미선택 오류 alert(`변경할 항목을 선택해주세요.`) → 확인 alert
 * (`선택 항목을 변경하시겠습니까?`) → 완료 alert(`변경되었습니다.`). 완료를 확인하면 선택이 풀리고,
 * 무효화된 조회가 바뀐 상태를 다시 그린다(`확인 : alert 닫히고, 변경 상태로 화면 갱신됨`).
 * 미리보기는 선택 없이 팝업을 연다. alert·확인창·팝업의 수명은 늘 mount 되는 이 컴포넌트가 소유해
 * 조회 상태가 바뀌어도 열린 팝업이 사라지지 않는다.
 */
export function BannerListActions({
  selectedIds,
  onChanged,
  onCreate,
}: {
  readonly selectedIds: readonly string[];
  readonly onChanged: () => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('exhibitions');
  const { t: shared } = useTranslation('shared');
  const actions = useBannerListActions(selectedIds);
  const [completed, setCompleted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
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
          aria-label={t('banner.result.bulkField')}
          className="w-52"
          placeholder={t('banner.result.bulkPlaceholder')}
          value={actions.target === undefined ? null : bannerBulkChangeValue(actions.target)}
          options={bannerBulkChanges.map((change) => ({
            value: bannerBulkChangeValue(change),
            label: t(`banner.values.status.${change.value}`),
          }))}
          onValueChange={(value) => actions.setTarget(parseBannerBulkChange(value))}
        />
        <Button onClick={requestBulkChange}>{t('banner.result.bulkChange')}</Button>
        <Button
          className="bg-white text-neutral-900 ring-1 ring-neutral-300"
          onClick={() => setPreviewOpen(true)}
        >
          {t('banner.result.preview')}
        </Button>
        <Button onClick={onCreate}>{t('banner.result.create')}</Button>
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
      <BannerPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}
