import { useTranslation } from 'react-i18next';
import { usePerformanceVenues } from '@/features/performances/api/usePerformanceVenues';
import {
  contentKeywordFields,
  contentPeriodTypes,
  contentUsageStatuses,
  type ContentPeriodType,
  type ContentUsageStatus,
} from '@/features/performances/model/content';
import { performanceTicketKinds, performanceTypes } from '@/features/performances/model/performance';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { standardPeriodPresetValues } from '@/shared/model/list-options';
import { AsyncFieldBoundary } from '@/shared/ui/feedback/AsyncFieldBoundary';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { InlineSearchSelect } from '@/shared/ui/primitives/InlineSearchSelect';
import type { useContentListFilter } from '../model/useContentListFilter';

/**
 * Figma `5.1.1.1. Case 정의`(`129:21800`) 검색 영역: 기간(기준 select + preset + 범위), 검색어(대상 3개 +
 * chip), 구분·공연유형 다중선택, 공연장(검색해서 하나 선택), 사용상태 다중선택, 그리고 검색·초기화.
 * 5.2 와 달리 예매처가 없고 사용상태가 있다. 각 `전체` = 조건 없음(Notion `default : 전체`).
 * 공연장 선택지는 서버 조회라 AsyncFieldBoundary 안에서만 렌더해 실패를 빈 목록으로 숨기지 않는다.
 * TRANSPLANT_PENDING_CONTENT_FILTER_OPTIONS: 구분·유형·사용상태 값은 관찰한 라벨이지 서버 enum 이 아니다.
 */
export function ContentListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useContentListFilter>;
}) {
  const { t } = useTranslation('performances');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;
  const venues = usePerformanceVenues();
  const options = <T extends string>(values: readonly T[], prefix: string) =>
    values.map((value) => ({ value, label: t(`${prefix}.${value}`) }));

  return (
    <FilterPanel
      onSubmit={filter.submit}
      onReset={filter.reset}
    >
      <PeriodFilterField
        label={t('content.filters.period')}
        criterion={{
          value: draft.periodType ?? 'performedAt',
          options: contentPeriodTypes.map((value) => ({ value, label: t(`content.fields.${value}`) })),
          onValueChange: (value: ContentPeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        range={period.range}
        onPresetChange={period.setPreset}
        onRangeChange={period.setRange}
      />
      <KeywordFilterField
        label={t('content.filters.keyword')}
        field={{
          value: keyword.pending.field,
          options: contentKeywordFields.map((value) => ({ value, label: t(`content.fields.${value}`) })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        formatItem={(item) => `${t(`content.fields.${item.field}`)}: ${item.value}`}
      />
      <FilterField label={t('content.fields.ticketKind')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={options(performanceTicketKinds, 'options')}
            values={draft.ticketKinds ?? []}
            onValueChange={(ticketKinds) => patchDraft({ ticketKinds })}
          />
        )}
      </FilterField>
      <FilterField label={t('content.fields.performanceType')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={options(performanceTypes, 'options')}
            values={draft.performanceTypes ?? []}
            onValueChange={(performanceTypes) => patchDraft({ performanceTypes })}
          />
        )}
      </FilterField>
      <FilterField label={t('content.filters.venue')} group>
        {({ controlId, labelId }) => (
          <AsyncFieldBoundary state={venues.state} labelledBy={labelId} onRetry={venues.retry}>
            <InlineSearchSelect
              id={controlId}
              value={draft.venueId}
              selectedLabel={
                venues.items.find(({ id }) => id === draft.venueId)?.name ?? t('content.filters.venue')
              }
              options={venues.items.map(({ id, name }) => ({ value: id, label: name }))}
              onValueChange={(venueId) => patchDraft({ venueId })}
              searchValue={draft.venueKeyword}
              onSearchValueChange={(venueKeyword) => patchDraft({ venueKeyword })}
              searchLabel={t('content.filters.venueSearch')}
              placeholder={t('content.filters.venueSearch')}
              clearLabel={t('content.filters.clearVenue')}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t('content.filters.usageStatus')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={options(contentUsageStatuses, 'content.options')}
            values={draft.usageStatuses ?? []}
            onValueChange={(values) => patchDraft({ usageStatuses: values as ContentUsageStatus[] })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
