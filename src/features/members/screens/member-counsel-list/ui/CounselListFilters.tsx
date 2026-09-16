import { useTranslation } from 'react-i18next';
import type { CounselSelectOptions } from '@/features/members/api/useCounselOptions';
import {
  MemberAccountStatusFilter,
  MemberSignupMethodFilter,
} from '@/features/members/mechanics/filters/ui/MemberFilterFields';
import {
  counselKeywordFields,
  counselPeriodTypes,
  counselStatuses,
  type CounselPeriodType,
  type CounselStatus,
} from '@/features/members/model/member-records';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { standardPeriodPresetValues } from '@/shared/model/list-options';
import { AsyncFieldBoundary } from '@/shared/ui/feedback/AsyncFieldBoundary';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Select } from '@/shared/ui/primitives/Select';
import type { useCounselListFilter } from '../model/useCounselListFilter';

/** 검색 영역의 "전체"(조건 없음)를 뜻하는 UI 전용 값. URL·요청에는 나가지 않는다. */
const ANY_INQUIRY = 'all';

/**
 * 원장 4.6 검색 영역: 기간(접수일·답변일) · 검색어(이메일·이름·휴대폰·문의내용) · 가입방법 · 계정 상태 · 문의유형(서버 옵션,
 * 하나) · 진행상태. 서버 옵션은 AsyncFieldBoundary 안에서만 렌더해 실패를 빈 목록으로 숨기지 않는다.
 */
export function CounselListFilters({
  filter,
  inquiryOptions,
}: {
  readonly filter: ReturnType<typeof useCounselListFilter>;
  readonly inquiryOptions: CounselSelectOptions;
}) {
  const { t } = useTranslation('members');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  return (
    <FilterPanel
      title={t('search')}
      submitLabel={t('search')}
      resetLabel={t('reset')}
      collapseLabel={t('filters.collapse')}
      expandLabel={t('filters.expand')}
      onReset={filter.reset}
      onSubmit={filter.submit}
    >
      <PeriodFilterField
        label={t('filters.period')}
        criterion={{
          label: t('filters.periodType'),
          value: draft.periodType ?? 'receivedAt',
          options: counselPeriodTypes.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: (value: CounselPeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        presetGroupLabel={t('filters.periodPreset')}
        range={period.range}
        onPresetChange={period.setPreset}
        onRangeChange={period.setRange}
        fromLabel={t('filters.startDate')}
        toLabel={t('filters.endDate')}
        calendarLabel={t('filters.calendar')}
      />
      <KeywordFilterField
        label={t('filters.keyword')}
        field={{
          label: t('filters.keywordType'),
          value: keyword.pending.field,
          options: counselKeywordFields.map((value) => ({ value, label: t(`fields.${value}`) })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        addLabel={t('filters.add')}
        removeLabel={(item) => t('filters.remove', { value: item.value })}
        inputLabel={t('filters.keyword')}
        formatItem={(item) => `${t(`fields.${item.field}`)} : ${item.value}`}
      />
      <MemberSignupMethodFilter values={draft.signupMethods ?? []} onChange={(signupMethods) => patchDraft({ signupMethods })} />
      <MemberAccountStatusFilter
        values={draft.accountStatuses ?? []}
        onChange={(accountStatuses) => patchDraft({ accountStatuses })}
      />
      <FilterField label={t('fields.inquiryType')}>
        {({ labelId, controlId }) => (
          <AsyncFieldBoundary labelledBy={labelId} state={inquiryOptions.state} onRetry={inquiryOptions.retry}>
            <Select
              id={controlId}
              aria-labelledby={labelId}
              value={draft.inquiryType ?? ANY_INQUIRY}
              onValueChange={(value) =>
                patchDraft({ inquiryType: value === null || value === ANY_INQUIRY ? undefined : value })
              }
              options={[{ value: ANY_INQUIRY, label: t('filters.all') }, ...inquiryOptions.items]}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t('filters.progress')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            selectAllLabel={t('filters.all')}
            nodes={counselStatuses.map((value) => ({ value, label: t(`states.${value}`) }))}
            values={draft.statuses ?? []}
            onValueChange={(values) => patchDraft({ statuses: values as CounselStatus[] })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
