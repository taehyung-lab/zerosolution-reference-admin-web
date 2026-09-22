import { useTranslation } from 'react-i18next';
import {
  useTicketIssuePerformances,
  useTicketIssueSchedules,
} from '@/features/ticketing/api/useTicketIssueLookups';
import {
  reissueStatuses,
  reservationStatuses,
  ticketIssueKeywordFields,
  ticketIssuePeriodTypes,
  ticketIssueStatusFilters,
  ticketVendors,
  type ReissueStatus,
  type ReservationStatus,
  type TicketIssuePeriodType,
  type TicketIssueStatusFilter,
  type TicketIssueSchedule,
  type TicketVendor,
} from '@/features/ticketing/model/ticket-issue';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { standardPeriodPresetValues } from '@/shared/lib/list-options';
import { AsyncFieldBoundary } from '@/shared/ui/feedback/AsyncFieldBoundary';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { InlineSearchSelect } from '@/shared/ui/primitives/InlineSearchSelect';
import { Select } from '@/shared/ui/primitives/Select';
import type { useTicketIssueListFilter } from '../model/useTicketIssueListFilter';

/** 공연일 select 의 `전체` 는 화면 전용 항목이라 URL 로 나가지 않는다. */
const ALL_SCHEDULES = 'ALL';

/**
 * fact 「검색 조건」의 검색 영역이다. 공연을 고르기 전에는 공연 검색 · 기간 · 검색어 셋만 있고,
 * 고른 뒤에 공연일과 네 다중선택이 더해진다(원문 「공연 선택 후 추가 검색 조건이 제공된다」).
 * 각 `전체` = 조건 없음.
 *
 * 결제금액 조건은 그리지 않는다 — 최소·최대·단위의 출처가 원문에 없다(fact 미확인 2, 보류).
 * 공연·공연일 선택지는 서버 조회라 `AsyncFieldBoundary` 안에서만 렌더해 실패를 빈 목록으로 숨기지 않는다.
 */
export function TicketIssueListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useTicketIssueListFilter>;
}) {
  const { t } = useTranslation('ticketing');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;
  const performances = useTicketIssuePerformances();
  const schedules = useTicketIssueSchedules(draft.performanceId);
  const selectedPerformance = performances.items.find(({ id }) => id === draft.performanceId);

  return (
    <FilterPanel onSubmit={filter.submit} onReset={filter.reset}>
      <FilterField label={t('issue.filter.performance')} group>
        {({ controlId, labelId }) => (
          <AsyncFieldBoundary state={performances.state} labelledBy={labelId} onRetry={performances.retry}>
            <InlineSearchSelect
              id={controlId}
              value={draft.performanceId}
              selectedLabel={selectedPerformance?.name ?? t('issue.filter.performance')}
              options={performances.items.map(({ id, name }) => ({ value: id, label: name }))}
              onValueChange={filter.selectPerformance}
              searchValue={draft.performanceKeyword}
              onSearchValueChange={(performanceKeyword) => patchDraft({ performanceKeyword })}
              searchLabel={t('issue.filter.performanceSearch')}
              placeholder={t('issue.filter.performanceSearch')}
              clearLabel={t('issue.filter.clearPerformance')}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      {draft.performanceId === undefined ? null : (
        <FilterField label={t('issue.filter.schedule')} required group>
          {({ controlId, labelId }) => (
            <AsyncFieldBoundary state={schedules.state} labelledBy={labelId} onRetry={schedules.retry}>
              <Select
                className="w-96"
                id={controlId}
                value={draft.scheduleId ?? ALL_SCHEDULES}
                options={[
                  { value: ALL_SCHEDULES, label: t('issue.filter.allSchedules') },
                  ...schedules.items.map((schedule) => ({
                    value: schedule.id,
                    label: scheduleLabel(t, schedule),
                  })),
                ]}
                onValueChange={(value) =>
                  patchDraft({ scheduleId: value === null || value === ALL_SCHEDULES ? undefined : value })
                }
              />
            </AsyncFieldBoundary>
          )}
        </FilterField>
      )}
      <PeriodFilterField
        label={t('issue.filter.period')}
        criterion={{
          value: draft.periodType ?? 'reservedAt',
          options: ticketIssuePeriodTypes.map((value) => ({
            value,
            label: t(`issue.values.periodType.${value}`),
          })),
          onValueChange: (value: TicketIssuePeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        onPresetChange={period.setPreset}
        range={period.range}
        onRangeChange={period.setRange}
      />
      <KeywordFilterField
        label={t('issue.filter.keyword')}
        field={{
          value: keyword.pending.field,
          options: ticketIssueKeywordFields.map((value) => ({
            value,
            label: t(`issue.values.keywordField.${value}`),
          })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        formatItem={(item) =>
          t('issue.filter.keywordChip', {
            field: t(`issue.values.keywordField.${item.field}`),
            value: item.value,
          })
        }
      />
      {draft.performanceId === undefined ? null : (
        <>
          <FilterField label={t('issue.filter.vendor')}>
            {({ labelId }) => (
              <CheckboxTree
                ariaLabelledby={labelId}
                emptyMeansAll
                nodes={ticketVendors.map((value) => ({
                  value,
                  label: t(`issue.values.vendor.${value}`),
                }))}
                values={draft.vendors ?? []}
                onValueChange={(values) => patchDraft({ vendors: values as TicketVendor[] })}
              />
            )}
          </FilterField>
          <FilterField label={t('issue.filter.reservationStatus')}>
            {({ labelId }) => (
              <CheckboxTree
                ariaLabelledby={labelId}
                emptyMeansAll
                nodes={reservationStatuses.map((value) => ({
                  value,
                  label: t(`issue.values.reservationStatus.${value}`),
                }))}
                values={draft.reservationStatuses ?? []}
                onValueChange={(values) =>
                  patchDraft({ reservationStatuses: values as ReservationStatus[] })
                }
              />
            )}
          </FilterField>
          <FilterField label={t('issue.filter.issueStatus')}>
            {({ labelId }) => (
              <CheckboxTree
                ariaLabelledby={labelId}
                emptyMeansAll
                nodes={ticketIssueStatusFilters.map((value) => ({
                  value,
                  label: t(`issue.values.issueStatus.${value}`),
                }))}
                values={draft.issueStatuses ?? []}
                onValueChange={(values) =>
                  patchDraft({ issueStatuses: values as TicketIssueStatusFilter[] })
                }
              />
            )}
          </FilterField>
          <FilterField label={t('issue.filter.reissueStatus')}>
            {({ labelId }) => (
              <CheckboxTree
                ariaLabelledby={labelId}
                emptyMeansAll
                nodes={[
                  { value: 'NEW', label: t('issue.values.reissueStatus.NEW') },
                  {
                    label: t('issue.filter.reissueBranch'),
                    children: reissueStatuses
                      .filter((value) => value !== 'NEW')
                      .map((value) => ({ value, label: t(`issue.values.reissueStatus.${value}`) })),
                  },
                ]}
                values={draft.reissueStatuses ?? []}
                onValueChange={(values) => patchDraft({ reissueStatuses: values as ReissueStatus[] })}
              />
            )}
          </FilterField>
        </>
      )}
    </FilterPanel>
  );
}

/** frame 의 `1회차 2026-01-03 14:00 ~ 2026-01-03 16:00`. */
function scheduleLabel(
  t: ReturnType<typeof useTranslation<'ticketing'>>['t'],
  schedule: TicketIssueSchedule,
): string {
  return t('issue.filter.scheduleOption', {
    round: t('issue.values.round', { round: schedule.round }),
    start: formatMinute(schedule.startAt),
    end: formatMinute(schedule.endAt),
  });
}

function formatMinute(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone())}`;
}
