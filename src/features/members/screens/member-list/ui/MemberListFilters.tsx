import { useTranslation } from 'react-i18next';
import {
  MemberAccountStatusFilter,
  MemberRestrictionFilter,
  MemberSignupMethodFilter,
} from '@/features/members/mechanics/filters/ui/MemberFilterFields';
import {
  memberKeywordFields,
  memberPeriodTypes,
  memberRestrictions,
  type MemberPeriodType,
} from '@/features/members/model/member';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { standardPeriodPresetValues } from '@/shared/model/list-options';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import type { MemberListDefinition } from '../model/member-list-definition';
import type { useMemberListFilter } from '../model/useMemberListFilter';

/**
 * 원장 4.1 검색 영역: 기간(기준 select + preset + 범위), 검색어(대상 3개 + chip), 가입방법, 그리고 정의가 노출하는
 * 계정 상태·활동제한 다중선택(각 `전체` = 조건 없음), 검색·초기화.
 */
export function MemberListFilters({
  filter,
  definition,
}: {
  readonly filter: ReturnType<typeof useMemberListFilter>;
  readonly definition: MemberListDefinition;
}) {
  const { t } = useTranslation('members');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  return (
    <FilterPanel
      onReset={filter.reset}
      onSubmit={filter.submit}
    >
      <PeriodFilterField
        label={t('filters.period')}
        criterion={{
          value: draft.periodType ?? 'joinedAt',
          options: memberPeriodTypes.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: (value: MemberPeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        range={period.range}
        onPresetChange={period.setPreset}
        onRangeChange={period.setRange}
      />
      <KeywordFilterField
        label={t('filters.keyword')}
        field={{
          value: keyword.pending.field,
          options: memberKeywordFields.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        formatItem={(item) => `${t(`fields.${item.field}`)} : ${item.value}`}
      />
      <MemberSignupMethodFilter
        values={draft.signupMethods ?? []}
        onChange={(signupMethods) => patchDraft({ signupMethods })}
      />
      {definition.accountStatusFilter ? (
        <MemberAccountStatusFilter
          values={draft.accountStatuses ?? []}
          onChange={(accountStatuses) => patchDraft({ accountStatuses })}
        />
      ) : null}
      {definition.restrictionFilter ? (
        <MemberRestrictionFilter
          restrictions={memberRestrictions}
          values={draft.restrictions ?? []}
          onChange={(restrictions) => patchDraft({ restrictions })}
        />
      ) : null}
    </FilterPanel>
  );
}
