import { useTranslation } from 'react-i18next';
import type { ManagerRow } from '@/features/managers/model/manager';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import { useManagerListActions } from '../model/useManagerListActions';

/**
 * 결과 toolbar 우측: `변경 항목 ▾` + `변경`(검색 뒤에만) · `등록`.
 * 확인 lifecycle 과 거절·확인 팝업의 수명은 이 컴포넌트가 소유한다 — 버튼은 검색 뒤에만 보이지만
 * 팝업은 조건 밖에서 렌더해 조회 상태가 바뀌어도 열린 채로 남는다.
 */
export function ManagerListActions({
  searched,
  selectedIds,
  rows,
  onCreate,
}: {
  readonly searched: boolean;
  readonly selectedIds: readonly string[];
  readonly rows: readonly ManagerRow[];
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('managers');
  const actions = useManagerListActions(selectedIds, rows);
  const confirmation = useConfirmation({
    run: actions.runBulkChange,
    description: t('bulk.confirm'),
  });
  const requestBulkChange = () => {
    const request = actions.prepareBulkChange();
    if (request !== undefined) confirmation.request(request);
  };

  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        {searched ? (
          <>
            <Select
              aria-label={t('bulk.field')}
              className="w-auto"
              value={actions.target ?? null}
              placeholder={t('bulk.select')}
              options={[
                { value: 'active', label: t('bulk.active') },
                { value: 'inactive', label: t('bulk.inactive') },
              ]}
              onValueChange={(value) =>
                actions.setTarget(value === 'active' || value === 'inactive' ? value : undefined)
              }
            />
            <Button onClick={requestBulkChange}>{t('bulk.change')}</Button>
          </>
        ) : null}
        <Button onClick={onCreate}>{t('form.createAction')}</Button>
      </div>
      <SelectionAlert controller={actions.gate} />
      {confirmation.dialog}
    </>
  );
}
