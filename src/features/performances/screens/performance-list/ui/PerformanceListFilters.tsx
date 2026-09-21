import { useTranslation } from 'react-i18next';
import { usePerformanceVenues } from '@/features/performances/api/usePerformanceVenues';
import {
  performanceKeywordFields,
  performancePeriodTypes,
  performanceSellers,
  performanceTicketKinds,
  performanceTypes,
  type PerformancePeriodType,
} from '@/features/performances/model/performance';
import { standardPeriodPresetValues } from '@/shared/lib/list-options';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { AsyncFieldBoundary } from '@/shared/ui/feedback/AsyncFieldBoundary';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { InlineSearchSelect } from '@/shared/ui/primitives/InlineSearchSelect';
import type { usePerformanceListFilter } from '../model/usePerformanceListFilter';

/**
 * 원장 5.2 검색 영역: 기간(기준 select + preset + 범위), 검색어(대상 3개 + chip), 구분·공연유형·예매처
 * 다중선택(각 `전체` = 조건 없음), 공연장(검색해서 하나 선택), 그리고 검색·초기화.
 * 공연장 선택지는 서버 조회라 AsyncFieldBoundary 안에서만 렌더해 실패를 빈 목록으로 숨기지 않는다.
 * TRANSPLANT_PENDING_PERFORMANCE_FILTER_OPTIONS: 구분·유형·예매처 값은 관찰한 라벨이지 서버 enum 이 아니다.
 */
export function PerformanceListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof usePerformanceListFilter>;
}) {
  const { t } = useTranslation('performances');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;
  const venues = usePerformanceVenues();
  const options = <T extends string>(values: readonly T[]) =>
    values.map((value) => ({ value, label: t(`options.${value}`) }));

  return (
    <FilterPanel
      onSubmit={filter.submit}
      onReset={filter.reset}
    >
      <PeriodFilterField
        label={t('filters.period')}
        criterion={{
          value: draft.periodType ?? 'performedAt',
          options: performancePeriodTypes.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: (value: PerformancePeriodType) => patchDraft({ periodType: value }),
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
          options: performanceKeywordFields.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        formatItem={(item) => `${t(`fields.${item.field}`)}: ${item.value}`}
      />
      <FilterField label={t('fields.ticketKind')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={options(performanceTicketKinds)}
            values={draft.ticketKinds ?? []}
            onValueChange={(ticketKinds) => patchDraft({ ticketKinds })}
          />
        )}
      </FilterField>
      <FilterField label={t('fields.performanceType')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={options(performanceTypes)}
            values={draft.performanceTypes ?? []}
            onValueChange={(performanceTypes) => patchDraft({ performanceTypes })}
          />
        )}
      </FilterField>
      <FilterField label={t('filters.venue')} group>
        {({ controlId, labelId }) => (
          <AsyncFieldBoundary state={venues.state} labelledBy={labelId} onRetry={venues.retry}>
            <InlineSearchSelect
              id={controlId}
              value={draft.venueId}
              selectedLabel={venues.items.find(({ id }) => id === draft.venueId)?.name ?? t('filters.venue')}
              options={venues.items.map(({ id, name }) => ({ value: id, label: name }))}
              onValueChange={(venueId) => patchDraft({ venueId })}
              searchValue={draft.venueKeyword}
              onSearchValueChange={(venueKeyword) => patchDraft({ venueKeyword })}
              searchLabel={t('filters.venueSearch')}
              placeholder={t('filters.venueSearch')}
              clearLabel={t('filters.clearVenue')}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t('fields.seller')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={options(performanceSellers)}
            values={draft.sellers ?? []}
            onValueChange={(sellers) => patchDraft({ sellers })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
