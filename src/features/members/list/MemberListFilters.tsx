import { standardPeriodPresetValues } from '@/shared/config/list';
import { usePeriodPresetLabels } from '@/shared/i18n/use-period-preset-labels';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { FilterField } from '@/shared/ui/patterns/FilterField';
import { FilterPanel } from '@/shared/ui/patterns/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/patterns/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/patterns/PeriodFilterField';
import { useTranslation } from 'react-i18next';
import type { MemberListDefinition } from './member-list-definition';
import type { MemberSearch } from './search-schema';
import type { useMemberListFilter } from './useMemberListFilter';

export function MemberListFilters({
  filter,
  definition,
}: {
  readonly filter: ReturnType<typeof useMemberListFilter>;
  readonly definition: MemberListDefinition;
}) {
  const { t } = useTranslation('members');
  const presetLabels = usePeriodPresetLabels();
  const signupNodes = [
    { value: 'direct', label: t('signup.direct') },
    { value: 'kakao', label: t('signup.kakao') },
    { value: 'naver', label: t('signup.naver') },
    { value: 'apple', label: t('signup.apple') },
    { value: 'melon', label: t('signup.melon') },
  ];
  const restrictionNodes = [
    { value: 'specialContent', label: t('restriction.specialContent') },
    { value: 'inquiry', label: t('restriction.inquiry') },
    { value: 'entry', label: t('restriction.entry') },
  ];
  return (
    <FilterPanel
      title={t('search')}
      collapseLabel={t('filters.collapse')}
      expandLabel={t('filters.expand')}
      submitLabel={t('search')}
      resetLabel={t('reset')}
      onSubmit={filter.submit}
      onReset={filter.reset}
    >
      <PeriodFilterField
        label={t('filters.period')}
        criterion={{
          label: t('filters.periodType'),
          value: filter.draft.periodType,
          options: [
            { value: 'joinedAt', label: t('columns.joinedAt') },
            { value: 'lastAccessedAt', label: t('columns.lastAccessedAt') },
          ],
          onValueChange: (periodType) => filter.patchDraft({ periodType }),
        }}
        preset={filter.period.preset}
        presets={standardPeriodPresetValues.map((value) => ({ value, label: presetLabels[value] }))}
        customLabel={presetLabels.CUSTOM}
        presetGroupLabel={t('filters.periodPreset')}
        range={filter.period.range}
        onPresetChange={filter.period.setPreset}
        onRangeChange={filter.period.setRange}
        fromLabel={t('filters.startDate')}
        toLabel={t('filters.endDate')}
        calendarLabel={t('filters.calendar')}
      />
      <div>
        <KeywordFilterField
          label={t('filters.keyword')}
          field={{
            label: t('filters.keywordType'),
            value: filter.keyword.pending.field,
            options: [
              { value: 'email', label: t('columns.email') },
              { value: 'name', label: t('columns.name') },
              { value: 'phone', label: t('columns.phone') },
            ],
            onValueChange: filter.keyword.setPendingField,
          }}
          items={filter.keyword.items}
          pendingValue={filter.keyword.pending.value}
          onPendingValueChange={filter.keyword.setPendingValue}
          onAdd={filter.addKeyword}
          onRemoveAt={filter.keyword.removeAt}
          addLabel={t('filters.add')}
          removeLabel={(item) => t('filters.remove', { value: item.value })}
          inputLabel={t('filters.keyword')}
          formatItem={(item) => `${t(`columns.${item.field}`)} : ${item.value}`}
        />
      </div>
      <FilterField label={t('filters.signupMethod')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t('filters.all')}
            nodes={signupNodes}
            values={filter.draft.signupMethods}
            emptyMeansAll
            onValueChange={(signupMethods) => filter.patchDraft({ signupMethods: signupMethods as MemberSearch['signupMethods'] })}
          />
        )}
      </FilterField>
      {definition.accountStatusFilter ? (
        <FilterField label={t('filters.accountStatus')}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t('filters.all')}
              nodes={[
                { value: 'general', label: t('accountStatus.general') },
                { value: 'flagged', label: t('accountStatus.flagged') },
              ]}
              values={filter.draft.accountStatuses}
              emptyMeansAll
              onValueChange={(accountStatuses) => filter.patchDraft({ accountStatuses: accountStatuses as MemberSearch['accountStatuses'] })}
            />
          )}
        </FilterField>
      ) : null}
      {definition.restrictionFilter ? (
        <FilterField label={t('filters.restrictions')}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t('filters.all')}
              nodes={restrictionNodes}
              values={filter.draft.restrictions}
              emptyMeansAll
              onValueChange={(restrictions) => filter.patchDraft({ restrictions: restrictions as MemberSearch['restrictions'] })}
            />
          )}
        </FilterField>
      ) : null}
    </FilterPanel>
  );
}
