import { useTranslation } from 'react-i18next';
import { memberAccountStatuses, type MemberRestriction } from '@/features/members/model/member';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { Button } from '@/shared/ui/primitives/Button';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Select } from '@/shared/ui/primitives/Select';
import type { MemberBulkChangeControls } from '../model/useMemberBulkChange';

/**
 * 일괄변경 입력: 계정 상태 select 와, 불량회원일 때만 열리는 활동제한 tree, `변경`. **이 컨트롤은 검색 전에
 * 숨겨지므로** 확인 lifecycle 을 여기 두지 않는다 — 늘 mount 되는 toolbar 가 확인창을 소유하고 여기는
 * `onRequestChange` 로 그 시작만 알린다. 고를 수 있는 활동제한은 화면이 준다.
 */
export function MemberBulkChangeControl({
  bulk,
  restrictions,
  onRequestChange,
}: {
  readonly bulk: MemberBulkChangeControls;
  readonly restrictions: readonly MemberRestriction[];
  readonly onRequestChange: () => void;
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
      <Button onClick={onRequestChange}>{t('bulk.change')}</Button>
    </>
  );
}
