/**
 * 회원 기록 목록의 입력 중 필터와 확정 검색 조건을 분리하고 검색·초기화를 URL 변경 callback에 전달한다.
 * 실제 API에서도 필요한 UI 상태다. 서버 행 필터링은 하지 않으며 기간·검색어 초안은 기존 공용 훅이 소유한다.
 */
import { compactSearchValues } from '@/shared/lib/compact-search-values';
import {
  filterPartitionKey,
  filterPartitionValues,
  type SearchFieldPartition,
} from '@/shared/lib/search-partition';
import { useDraftCommit } from '@/shared/lib/use-draft-commit';
import { useKeywordDraft } from '@/shared/lib/use-keyword-draft';
import { usePeriodDraft } from '@/shared/lib/use-period-draft';
import type { SubmitEvent } from 'react';
import type { MemberRecordSearch } from './member-record-search';

const partition = {
  periodType: 'filter',
  startDateTime: 'filter',
  endDateTime: 'filter',
  keywords: 'filter',
  signupMethods: 'filter',
  accountStatuses: 'filter',
  restrictions: 'filter',
  statuses: 'filter',
  results: 'filter',
  inquiryType: 'filter',
  accessPaths: 'filter',
  page: 'view',
  pageSize: 'view',
  sortType: 'view',
  sortDirection: 'view',
} as const satisfies SearchFieldPartition<MemberRecordSearch>;
const filters = (search: MemberRecordSearch) =>
  filterPartitionValues(search, partition);
const filterKey = (search: MemberRecordSearch) =>
  filterPartitionKey(search, partition);

export function useMemberRecordFilter(
  search: MemberRecordSearch,
  onSearchChange: (search: MemberRecordSearch) => void,
  defaultPeriod: string
) {
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: search,
    keyOf: filterKey,
    createDraft: (value) => ({
      ...filters(value),
      periodType: value.periodType ?? defaultPeriod,
    }),
  });
  const resetKey = filterKey(search);
  const period = usePeriodDraft({ committed: search, resetKey });
  const keyword = useKeywordDraft({
    committedItems: search.keywords ?? [],
    initialField: 'email' as const,
    resetKey,
  });
  return {
    draft,
    patchDraft,
    period,
    keyword,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSearchChange(
        compactSearchValues({
          ...search,
          ...draft,
          ...period.utcRange,
          keywords: [...keyword.itemsIncludingPending()],
          page: undefined,
        })
      );
    },
    reset: () => {
      resetDraft();
      period.reset();
      keyword.reset();
      onSearchChange({});
    },
  };
}
