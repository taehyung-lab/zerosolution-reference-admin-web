import { useTranslation } from 'react-i18next';
import {
  termsKeywordFields,
  termsPeriodTypes,
  termsStatuses,
} from '@/features/terms/model/terms';
import type { TermsPeriodType } from '@/features/terms/model/terms';
import { standardPeriodPresetValues } from '@/shared/lib/list-options';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import type { useTermsListFilter } from '../model/useTermsListFilter';

/**
 * Figma 11.2.1.1 Case 정의의 검색 영역 순서: 기간 → 검색어 → 게시 상태 → 검색·초기화.
 * 선택지가 전부 도메인 enum 이라 서버에서 오는 option source 가 없다. 패널 제목·검색/초기화·기간·
 * 검색어 같은 공통 문구는 공용 단위가 `shared` namespace 에서 읽으므로 여기서 넘기지 않는다.
 *
 * `11.2.1. 약관 리스트` frame 은 같은 자리에 빈 공간만 두고 `게시 상태` 행을 그리지 않는다. 그 행을
 * 그리는 것은 Case 정의 frame 과 Notion `검색 영역 → 게시 상태 → default : 전체` 두 근거이고,
 * 두 관찰의 차이는 TERMS-LIST 미확인 1 이 소유한다.
 */
export function TermsListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useTermsListFilter>;
}) {
  const { t } = useTranslation('terms');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  return (
    <FilterPanel onSubmit={filter.submit} onReset={filter.reset}>
      <PeriodFilterField
        label={t('terms.filter.period.label')}
        criterion={{
          value: draft.periodType ?? 'registeredAt',
          options: termsPeriodTypes.map((value) => ({
            value,
            label: t(`terms.values.periodType.${value}`),
          })),
          onValueChange: (value: TermsPeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        onPresetChange={period.setPreset}
        range={period.range}
        onRangeChange={period.setRange}
      />
      <KeywordFilterField
        label={t('terms.filter.keyword.label')}
        field={{
          value: keyword.pending.field,
          options: termsKeywordFields.map((value) => ({
            value,
            label: t(`terms.values.keywordField.${value}`),
          })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        formatItem={(item) =>
          t('terms.filter.keyword.chip', {
            field: t(`terms.values.keywordField.${item.field}`),
            value: item.value,
          })
        }
      />
      <FilterField label={t('terms.filter.status.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={termsStatuses.map((value) => ({
              value,
              label: t(`terms.values.status.${value}`),
            }))}
            values={draft.statuses ?? []}
            onValueChange={(values) =>
              patchDraft({ statuses: values as (typeof termsStatuses)[number][] })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
