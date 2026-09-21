import { useTranslation } from 'react-i18next';
import { useManagerPermissionOptions, useManagerTypeOptions } from '@/features/managers/api/useManagerOptions';
import {
  managerAccountStatuses,
  managerKeywordFields,
  managerPeriodTypes,
  managerRegistrationRoutes,
  type ManagerAccountStatus,
  type ManagerPeriodType,
  type ManagerRegistrationRoute,
} from '@/features/managers/model/manager';
import { standardPeriodPresetValues } from '@/shared/lib/list-options';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { AsyncFieldBoundary } from '@/shared/ui/feedback/AsyncFieldBoundary';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Select } from '@/shared/ui/primitives/Select';
import type { useManagerListFilter } from '../model/useManagerListFilter';

/** 검색 영역의 "전체"(조건 없음)를 뜻하는 UI 전용 값. URL·요청에는 나가지 않는다. */
const ANY_PERMISSION = 'all';

/**
 * 원장 11.1 검색 영역: 기간(기준 select + preset + 범위), 검색어(대상 4개 + chip), 권한(전체 권한 중 하나),
 * 유형·가입경로·계정 상태 다중선택(각 `전체` = 조건 없음), 그리고 검색·초기화.
 * 서버가 주는 유형·권한 옵션은 AsyncFieldBoundary 안에서만 렌더해 실패를 빈 목록으로 숨기지 않는다.
 */
export function ManagerListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useManagerListFilter>;
}) {
  const { t } = useTranslation('managers');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;
  const types = useManagerTypeOptions();
  const permissions = useManagerPermissionOptions({ enabled: true });

  return (
    <FilterPanel
      onReset={filter.reset}
      onSubmit={filter.submit}
    >
      <PeriodFilterField
        label={t('filters.period')}
        criterion={{
          value: draft.periodType ?? 'joinedAt',
          options: managerPeriodTypes.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: (value: ManagerPeriodType) => patchDraft({ periodType: value }),
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
          options: managerKeywordFields.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        formatItem={(item) => `${t(`fields.${item.field}`)} : ${item.value}`}
      />
      <FilterField label={t('fields.permission')}>
        {({ labelId, controlId }) => (
          <AsyncFieldBoundary labelledBy={labelId} state={permissions.state} onRetry={permissions.retry}>
            <Select
              id={controlId}
              aria-labelledby={labelId}
              value={draft.permission ?? ANY_PERMISSION}
              onValueChange={(value) =>
                patchDraft({ permission: value === null || value === ANY_PERMISSION ? undefined : value })
              }
              options={[{ value: ANY_PERMISSION, label: t('filters.all') }, ...permissions.items]}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t('fields.type')}>
        {({ labelId }) => (
          <AsyncFieldBoundary labelledBy={labelId} state={types.state} onRetry={types.retry}>
            <CheckboxTree
              ariaLabelledby={labelId}
              emptyMeansAll
              nodes={types.items}
              values={draft.types ?? []}
              onValueChange={(values) => patchDraft({ types: values })}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t('fields.registrationRoute')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={managerRegistrationRoutes.map((value) => ({ value, label: value }))}
            values={draft.registrationRoutes ?? []}
            onValueChange={(values) =>
              patchDraft({ registrationRoutes: values as ManagerRegistrationRoute[] })
            }
          />
        )}
      </FilterField>
      <FilterField label={t('fields.accountStatus')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={managerAccountStatuses.map((value) => ({ value, label: t(`accountStatus.${value}`) }))}
            values={draft.statuses ?? []}
            onValueChange={(values) => patchDraft({ statuses: values as ManagerAccountStatus[] })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
