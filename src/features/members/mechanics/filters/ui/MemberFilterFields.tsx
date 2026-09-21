import { useTranslation } from 'react-i18next';
import {
  memberAccountStatuses,
  memberSignupMethods,
  type MemberAccountStatus,
  type MemberRestriction,
  type MemberSignupMethod,
} from '@/features/members/model/member';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';

/**
 * 여러 회원 목록이 반복하는 다중선택 필터 세 개. 값과 어휘(`가입방법`·`계정 상태`·`활동제한`)는 도메인 model 이,
 * 초안 값과 변경 callback 은 각 화면의 filter 훅이 소유한다. `전체` 는 조건 없음이다.
 */
export function MemberSignupMethodFilter({
  values,
  onChange,
}: {
  readonly values: readonly MemberSignupMethod[];
  readonly onChange: (values: MemberSignupMethod[]) => void;
}) {
  const { t } = useTranslation('members');
  return (
    <FilterField label={t('filters.signupMethod')}>
      {({ labelId }) => (
        <CheckboxTree
          ariaLabelledby={labelId}
          emptyMeansAll
          nodes={memberSignupMethods.map((value) => ({ value, label: t(`signup.${value}`) }))}
          values={values}
          onValueChange={(next) => onChange(next as MemberSignupMethod[])}
        />
      )}
    </FilterField>
  );
}

export function MemberAccountStatusFilter({
  values,
  onChange,
}: {
  readonly values: readonly MemberAccountStatus[];
  readonly onChange: (values: MemberAccountStatus[]) => void;
}) {
  const { t } = useTranslation('members');
  return (
    <FilterField label={t('filters.accountStatus')}>
      {({ labelId }) => (
        <CheckboxTree
          ariaLabelledby={labelId}
          emptyMeansAll
          nodes={memberAccountStatuses.map((value) => ({ value, label: t(`accountStatus.${value}`) }))}
          values={values}
          onValueChange={(next) => onChange(next as MemberAccountStatus[])}
        />
      )}
    </FilterField>
  );
}

export function MemberRestrictionFilter({
  restrictions,
  values,
  onChange,
}: {
  readonly restrictions: readonly MemberRestriction[];
  readonly values: readonly MemberRestriction[];
  readonly onChange: (values: MemberRestriction[]) => void;
}) {
  const { t } = useTranslation('members');
  return (
    <FilterField label={t('filters.restrictions')}>
      {({ labelId }) => (
        <CheckboxTree
          ariaLabelledby={labelId}
          emptyMeansAll
          nodes={restrictions.map((value) => ({ value, label: t(`restriction.${value}`) }))}
          values={values}
          onValueChange={(next) => onChange(next as MemberRestriction[])}
        />
      )}
    </FilterField>
  );
}
