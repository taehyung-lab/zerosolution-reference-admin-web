import { useTranslation } from 'react-i18next';
import { MemberRestrictionFilter } from '@/features/members/mechanics/filters/ui/MemberFilterFields';
import { memberKeywordFields } from '@/features/members/model/member';
import {
  appealPeriodTypes,
  appealRestrictions,
  appealResults,
  appealStatuses,
  type AppealPeriodType,
  type AppealResult,
  type AppealStatus,
} from '@/features/members/model/member-records';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { standardPeriodPresetValues } from '@/shared/model/list-options';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import type { useAppealListFilter } from '../model/useAppealListFilter';

/** 원장 4.7 검색 영역: 기간(소명 신청일·불량회원 전환일) · 검색어(이메일·이름·휴대폰) · 활동제한 · 처리상태 · 소명결과. */
export function AppealListFilters({ filter }: { readonly filter: ReturnType<typeof useAppealListFilter> }) {
  const { t } = useTranslation('members');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  return (
    <FilterPanel
      title={t('search')}
      submitLabel={t('search')}
      resetLabel={t('reset')}
      collapseLabel={t('filters.collapse')}
      expandLabel={t('filters.expand')}
      onReset={filter.reset}
      onSubmit={filter.submit}
    >
      <PeriodFilterField
        label={t('filters.period')}
        criterion={{
          label: t('filters.periodType'),
          value: draft.periodType ?? 'appliedAt',
          options: appealPeriodTypes.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: (value: AppealPeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        presetGroupLabel={t('filters.periodPreset')}
        range={period.range}
        onPresetChange={period.setPreset}
        onRangeChange={period.setRange}
        fromLabel={t('filters.startDate')}
        toLabel={t('filters.endDate')}
        calendarLabel={t('filters.calendar')}
      />
      <KeywordFilterField
        label={t('filters.keyword')}
        field={{
          label: t('filters.keywordType'),
          value: keyword.pending.field,
          options: memberKeywordFields.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        addLabel={t('filters.add')}
        removeLabel={(item) => t('filters.remove', { value: item.value })}
        inputLabel={t('filters.keyword')}
        formatItem={(item) => `${t(`fields.${item.field}`)} : ${item.value}`}
      />
      <MemberRestrictionFilter
        restrictions={appealRestrictions}
        values={draft.restrictions ?? []}
        onChange={(restrictions) => patchDraft({ restrictions: restrictions as (typeof appealRestrictions)[number][] })}
      />
      <FilterField label={t('fields.status')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            selectAllLabel={t('filters.all')}
            nodes={appealStatuses.map((value) => ({ value, label: t(`states.${value}`) }))}
            values={draft.statuses ?? []}
            onValueChange={(values) => patchDraft({ statuses: values as AppealStatus[] })}
          />
        )}
      </FilterField>
      <FilterField label={t('fields.result')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            selectAllLabel={t('filters.all')}
            nodes={appealResults.map((value) => ({ value, label: t(`states.${value}`) }))}
            values={draft.results ?? []}
            onValueChange={(values) => patchDraft({ results: values as AppealResult[] })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
