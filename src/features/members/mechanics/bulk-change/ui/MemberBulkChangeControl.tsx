import { useTranslation } from 'react-i18next';
import { memberAccountStatuses, type MemberRestriction } from '@/features/members/model/member';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { Button } from '@/shared/ui/primitives/Button';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Select } from '@/shared/ui/primitives/Select';
import type { MemberBulkChangeControls } from '../model/useMemberBulkChange';

/**
 * 일괄변경 입력: 계정 상태 select 와, 불량회원일 때만 열리는 활동제한 tree, `변경`. 확인창(`bulk.dialog`)은
 * 이 컨트롤이 검색 전에 숨겨져도 남아야 하므로 호출한 toolbar 가 렌더한다. 고를 수 있는 활동제한은 화면이 준다.
 */
export function MemberBulkChangeControl({
  bulk,
  restrictions,
}: {
  readonly bulk: MemberBulkChangeControls;
  readonly restrictions: readonly MemberRestriction[];
}) {
  const { t } = useTranslation('members');
  const change = bulk.change;

  return (
    <>
      <div>
        <Select
          aria-label={t('bulk.field')}
          className="w-auto"
          value={change?.accountStatus ?? null}
          placeholder={t('bulk.select')}
          options={memberAccountStatuses.map((value) => ({ value, label: t(`accountStatus.${value}`) }))}
          onValueChange={(value) =>
            bulk.setChange(
              value === 'general'
                ? { accountStatus: 'general' }
                : value === 'flagged'
                  ? { accountStatus: 'flagged', restrictions: [] }
                  : null,
            )
          }
        />
        {change?.accountStatus === 'flagged' ? (
          <FilterField label={t('fields.restrictions')}>
            {({ labelId }) => (
              <CheckboxTree
                ariaLabelledby={labelId}
                selectAllLabel={t('filters.all')}
                nodes={restrictions.map((value) => ({ value, label: t(`restriction.${value}`) }))}
                values={change.restrictions}
                onValueChange={(values) =>
                  bulk.setChange({ accountStatus: 'flagged', restrictions: values as MemberRestriction[] })
                }
              />
            )}
          </FilterField>
        ) : null}
      </div>
      <Button onClick={bulk.request}>{t('bulk.change')}</Button>
    </>
  );
}
