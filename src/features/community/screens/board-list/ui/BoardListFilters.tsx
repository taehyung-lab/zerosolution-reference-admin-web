import { useTranslation } from 'react-i18next';
import {
  boardCategories,
  boardPeriodTypes,
  boardPermissions,
  boardTypes,
  boardUsages,
} from '@/features/community/model/board';
import type { BoardPermission, BoardPeriodType } from '@/features/community/model/board';
import { standardPeriodPresetValues } from '@/shared/model/list-options';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Select } from '@/shared/ui/primitives/Select';
import type { useBoardListFilter } from '../model/useBoardListFilter';

/** 검색 영역의 "전체"(조건 없음)를 뜻하는 UI 전용 값. URL·요청에는 나가지 않는다. */
const ANY_PERMISSION = 'ANY';

const toPermission = (value: string | null): BoardPermission | undefined =>
  value === null || value === ANY_PERMISSION ? undefined : (value as BoardPermission);

export function BoardListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useBoardListFilter>;
}) {
  const { t } = useTranslation('community');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  const permissionOptions = [
    { value: ANY_PERMISSION, label: t('board.filter.permission.any') },
    ...boardPermissions.map((value) => ({ value, label: t(`board.values.permission.${value}`) })),
  ];

  return (
    <FilterPanel
      title={t('board.filter.title')}
      collapseLabel={t('board.filter.collapse')}
      expandLabel={t('board.filter.expand')}
      submitLabel={t('board.filter.submit')}
      resetLabel={t('board.filter.reset')}
      onSubmit={filter.submit}
      onReset={filter.reset}
    >
      <PeriodFilterField
        label={t('board.filter.period.label')}
        criterion={{
          label: t('board.filter.period.criterion'),
          value: draft.periodType ?? 'registeredAt',
          options: boardPeriodTypes.map((value) => ({
            value,
            label: t(`board.values.periodType.${value}`),
          })),
          onValueChange: (value: BoardPeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        onPresetChange={period.setPreset}
        range={period.range}
        onRangeChange={period.setRange}
        fromLabel={t('board.filter.period.from')}
        toLabel={t('board.filter.period.to')}
        calendarLabel={t('board.filter.period.calendar')}
        presetGroupLabel={t('board.filter.period.presetGroup')}
      />
      <KeywordFilterField
        label={t('board.filter.keyword.label')}
        field={{
          label: t('board.filter.keyword.field'),
          value: keyword.pending.field,
          options: [{ value: 'name' as const, label: t('board.filter.keyword.name') }],
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        addLabel={t('board.filter.keyword.add')}
        removeLabel={(item) => t('board.filter.keyword.remove', { value: item.value })}
        inputLabel={t('board.filter.keyword.input')}
        formatItem={(item) => t('board.filter.keyword.chip', {
          field: t('board.filter.keyword.name'),
          value: item.value,
        })}
      />
      <FilterField label={t('board.filter.type.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={boardTypes.map((value) => ({
              value,
              label: t(`board.values.type.${value}`),
            }))}
            selectAllLabel={t('board.filter.all')}
            values={draft.types ?? []}
            onValueChange={(values) => patchDraft({ types: values as typeof boardTypes[number][] })}
          />
        )}
      </FilterField>
      <FilterField label={t('board.filter.category.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={boardCategories.map((value) => ({
              value,
              label: t(`board.values.category.${value}`),
            }))}
            selectAllLabel={t('board.filter.all')}
            values={draft.categories ?? []}
            onValueChange={(values) =>
              patchDraft({ categories: values as typeof boardCategories[number][] })}
          />
        )}
      </FilterField>
      <FilterField label={t('board.filter.usage.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={boardUsages.map((value) => ({
              value,
              label: t(`board.values.usage.${value}`),
            }))}
            selectAllLabel={t('board.filter.all')}
            values={draft.usages ?? []}
            onValueChange={(values) => patchDraft({ usages: values as typeof boardUsages[number][] })}
          />
        )}
      </FilterField>
      {/* 원문 41행의 `권한 > 쓰기·읽기`. 한 이름 아래 형제 컨트롤이라 group 하나로 묶고
          자식 라벨은 원문의 낱말을 그대로 쓴다(합성 라벨을 만들지 않는다). */}
      <FilterField label={t('board.filter.permission.label')} group>
        {() => (
          <>
            <Select
              aria-label={t('board.filter.permission.write')}
              className="w-64"
              options={permissionOptions}
              value={draft.writePermission ?? ANY_PERMISSION}
              onValueChange={(value) =>
                patchDraft({ writePermission: toPermission(value) })}
            />
            <Select
              aria-label={t('board.filter.permission.read')}
              className="w-64"
              options={permissionOptions}
              value={draft.readPermission ?? ANY_PERMISSION}
              onValueChange={(value) =>
                patchDraft({ readPermission: toPermission(value) })}
            />
          </>
        )}
      </FilterField>
    </FilterPanel>
  );
}
