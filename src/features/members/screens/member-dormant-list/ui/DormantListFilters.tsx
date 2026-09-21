import { useTranslation } from 'react-i18next';
import {
  MemberAccountStatusFilter,
  MemberSignupMethodFilter,
} from '@/features/members/shared/filters/ui/MemberFilterFields';
import { memberKeywordFields } from '@/features/members/model/member';
import { dormantPeriodTypes, type DormantPeriodType } from '@/features/members/model/member-records';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { standardPeriodPresetValues } from '@/shared/lib/list-options';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import type { useDormantListFilter } from '../model/useDormantListFilter';

/** 원장 4.3 검색 영역: 기간(가입일·최근접속일·휴면회원전환일) · 검색어(이메일·이름·휴대폰) · 가입방법 · 계정 상태. */
export function DormantListFilters({ filter }: { readonly filter: ReturnType<typeof useDormantListFilter> }) {
  const { t } = useTranslation('members');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  return (
    <FilterPanel
      onReset={filter.reset}
      onSubmit={filter.submit}
    >
      <PeriodFilterField
        label={t('filters.period')}
        criterion={{
          value: draft.periodType ?? 'joinedAt',
          options: dormantPeriodTypes.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: (value: DormantPeriodType) => patchDraft({ periodType: value }),
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
      <MemberSignupMethodFilter values={draft.signupMethods ?? []} onChange={(signupMethods) => patchDraft({ signupMethods })} />
      <MemberAccountStatusFilter
        values={draft.accountStatuses ?? []}
        onChange={(accountStatuses) => patchDraft({ accountStatuses })}
      />
    </FilterPanel>
  );
}
