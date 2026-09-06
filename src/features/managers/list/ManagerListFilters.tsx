import { FilterField } from '@/shared/ui/patterns/FilterField';
import { AsyncFieldBoundary } from '@/shared/ui/patterns/AsyncFieldBoundary';
import { usePeriodPresetLabels } from '@/shared/i18n/use-period-preset-labels';
import { standardPeriodPresetValues } from '@/shared/config/list';
import { FilterPanel } from '@/shared/ui/patterns/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/patterns/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/patterns/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { useTranslation } from 'react-i18next';
import type { ManagerSearch } from './search-schema';
import type { useManagerListFilter } from './useManagerListFilter';

export function ManagerListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useManagerListFilter>;
}) {
  const { t } = useTranslation('managers');
  const presetLabels = usePeriodPresetLabels();

  return (
    <FilterPanel
      onReset={filter.reset}
      onSubmit={filter.submit}
      title={t('search')}
      collapseLabel={t('filters.collapse')}
      expandLabel={t('filters.expand')}
      submitLabel={t('search')}
      resetLabel={t('reset')}
    >
      <PeriodFilterField
        label={t('filters.period')}
        criterion={{
          label: t('filters.periodType'),
          value: filter.draft.periodType,
          options: filter.options.periodType,
          onValueChange: (periodType) => filter.patchDraft({ periodType }),
        }}
        preset={filter.preset}
        presets={standardPeriodPresetValues.map((value) => ({
          value,
          label: presetLabels[value],
        }))}
        customLabel={presetLabels.CUSTOM}
        presetGroupLabel={t('filters.periodPreset')}
        onPresetChange={filter.setPreset}
        range={filter.range}
        onRangeChange={filter.setRange}
        fromLabel={t('filters.startDate')}
        toLabel={t('filters.endDate')}
        calendarLabel={t('filters.calendar')}
      />
      <KeywordFilterField
        label={t('filters.keyword')}
        field={{
          label: t('filters.keywordType'),
          value: filter.pendingKeyword.field,
          options: filter.options.keywordType,
          onValueChange: filter.setPendingKeywordField,
        }}
        items={filter.keywordItems}
        pendingValue={filter.pendingKeyword.value}
        onPendingValueChange={filter.setPendingKeywordValue}
        onAdd={() => void filter.addPendingKeyword()}
        onRemoveAt={filter.removeKeywordAt}
        addLabel={t('filters.add')}
        removeLabel={(item) => t('filters.remove', { value: item.value })}
        inputLabel={t('filters.keyword')}
        formatItem={(item) => `${filter.formatKeywordField(item.field)} : ${item.value}`}
      />
      <FilterField label={t('filters.type')}>
        {({ labelId }) => (
          <AsyncFieldBoundary
            labelledBy={labelId}
            state={filter.typeOptions.state}
            onRetry={() => void filter.typeOptions.retry()}
          >
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t('filters.all')}
              nodes={filter.typeOptions.items}
              values={filter.draft.types}
              emptyMeansAll
              onValueChange={(types) =>
                filter.patchDraft({ types: types as ManagerSearch['types'] })
              }
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t('filters.registrationRoute')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t('filters.all')}
            nodes={filter.options.registrationRoute}
            values={filter.draft.registrationRouteTypes}
            emptyMeansAll
            onValueChange={(registrationRouteTypes) =>
              filter.patchDraft({
                registrationRouteTypes:
                  registrationRouteTypes as ManagerSearch['registrationRouteTypes'],
              })
            }
          />
        )}
      </FilterField>
      <FilterField label={t('filters.status')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t('filters.all')}
            nodes={filter.options.status}
            values={filter.draft.statuses}
            emptyMeansAll
            onValueChange={(statuses) =>
              filter.patchDraft({
                statuses: statuses as ManagerSearch['statuses'],
              })
            }
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
