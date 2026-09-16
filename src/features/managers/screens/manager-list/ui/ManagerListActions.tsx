import { useTranslation } from 'react-i18next';
import type { ManagerRow } from '@/features/managers/model/manager';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import { useManagerListActions } from '../model/useManagerListActions';

/**
 * 결과 toolbar 우측: `변경 항목 ▾` + `변경`(검색 뒤에만) · `등록`.
 * 확인·거절 팝업의 수명은 이 컴포넌트가 소유해 조회 상태가 바뀌어도 열린 팝업이 사라지지 않는다.
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
            <Button onClick={actions.requestBulkChange}>{t('bulk.change')}</Button>
          </>
        ) : null}
        <Button onClick={onCreate}>{t('form.createAction')}</Button>
      </div>
      <SelectionAlert controller={actions.gate} />
      {actions.dialog}
    </>
  );
}
