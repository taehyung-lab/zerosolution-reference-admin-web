import { useTranslation } from 'react-i18next';
import {
  printerKeywordFields,
  printerPeriodTypes,
  printerPurposes,
  printerStatuses,
  printerUsages,
} from '@/features/ticketing/model/printer';
import type {
  PrinterPeriodType,
  PrinterPurpose,
  PrinterStatus,
  PrinterUsage,
} from '@/features/ticketing/model/printer';
import { standardPeriodPresetValues } from '@/shared/model/list-options';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import type { usePrinterListFilter } from '../model/usePrinterListFilter';

/**
 * Figma `6.7.1.1.1 Case 정의` 검색 영역: 기간(기준 select + preset + 범위), 검색어(대상 6개 + chip),
 * 상태·용도·사용상태 다중선택(각 `전체` = 조건 없음), 그리고 검색·초기화.
 */
export function PrinterListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof usePrinterListFilter>;
}) {
  const { t } = useTranslation('ticketing');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  return (
    <FilterPanel
      onSubmit={filter.submit}
      onReset={filter.reset}
    >
      <PeriodFilterField
        label={t('printer.filter.period.label')}
        criterion={{
          value: draft.periodType ?? 'registeredAt',
          options: printerPeriodTypes.map((value) => ({
            value,
            label: t(`printer.values.periodType.${value}`),
          })),
          onValueChange: (value: PrinterPeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        onPresetChange={period.setPreset}
        range={period.range}
        onRangeChange={period.setRange}
      />
      <KeywordFilterField
        label={t('printer.filter.keyword.label')}
        field={{
          value: keyword.pending.field,
          options: printerKeywordFields.map((value) => ({
            value,
            label: t(`printer.values.keywordField.${value}`),
          })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        formatItem={(item) =>
          t('printer.filter.keyword.chip', {
            field: t(`printer.values.keywordField.${item.field}`),
            value: item.value,
          })
        }
      />
      <FilterField label={t('printer.filter.status')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={printerStatuses.map((value) => ({
              value,
              label: t(`printer.values.status.${value}`),
            }))}
            values={draft.statuses ?? []}
            onValueChange={(values) => patchDraft({ statuses: values as PrinterStatus[] })}
          />
        )}
      </FilterField>
      <FilterField label={t('printer.filter.purpose')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={printerPurposes.map((value) => ({
              value,
              label: t(`printer.values.purpose.${value}`),
            }))}
            values={draft.purposes ?? []}
            onValueChange={(values) => patchDraft({ purposes: values as PrinterPurpose[] })}
          />
        )}
      </FilterField>
      <FilterField label={t('printer.filter.usage')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={printerUsages.map((value) => ({
              value,
              label: t(`printer.values.usage.${value}`),
            }))}
            values={draft.usages ?? []}
            onValueChange={(values) => patchDraft({ usages: values as PrinterUsage[] })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
