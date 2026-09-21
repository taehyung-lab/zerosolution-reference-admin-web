import { useTranslation } from 'react-i18next';
import { MemberAccountStatusFilter } from '@/features/members/mechanics/filters/ui/MemberFilterFields';
import { memberKeywordFields } from '@/features/members/model/member';
import { accessPaths, type AccessPath } from '@/features/members/model/member-records';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { standardPeriodPresetValues } from '@/shared/model/list-options';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import type { useAccessListFilter } from '../model/useAccessListFilter';

/** 원장 4.5 검색 영역: 접속일 기간(기준 고정) · 검색어(이메일·이름·휴대폰) · 계정 상태 · 접속경로. */
export function AccessListFilters({ filter }: { readonly filter: ReturnType<typeof useAccessListFilter> }) {
  const { t } = useTranslation('members');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  return (
    <FilterPanel
      onReset={filter.reset}
      onSubmit={filter.submit}
    >
      <PeriodFilterField
        label={t('fields.accessedAt')}
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
      <MemberAccountStatusFilter
        values={draft.accountStatuses ?? []}
        onChange={(accountStatuses) => patchDraft({ accountStatuses })}
      />
      <FilterField label={t('fields.accessPath')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={accessPaths.map((value) => ({ value, label: t(`accessPath.${value}`) }))}
            values={draft.accessPaths ?? []}
            onValueChange={(values) => patchDraft({ accessPaths: values as AccessPath[] })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
