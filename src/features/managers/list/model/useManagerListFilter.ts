/**
 * 기존 API 운영자 목록의 필터 초안·기간·검색어와 URL 검색 확정을 연결한다.
 * 실제 API에서도 필요한 입력 workflow다. 서버 enum에 의존하는 기본값은 계약 교체 때 재검토한다.
 */
import { filterPartitionKey, filterPartitionValues } from '@/shared/lib/search-partition';
import { useDraftCommit } from '@/shared/lib/use-draft-commit';
import { useKeywordDraft } from '@/shared/lib/use-keyword-draft';
import { usePeriodDraft } from '@/shared/lib/use-period-draft';
import { type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useManagerTypeOptions } from '../../options/useManagerOptions';
import { changeManagerView } from './manager-list-policy';
import {
  managerSearchPartition,
  resolveManagerSearch,
  toManagerRouteSearch,
  type ManagerRouteSearch,
  type ManagerSearch,
} from './search-schema';

type KeywordItem = ManagerSearch['keywords'][number];
type KeywordField = KeywordItem['keywordType'];

function committedFilterKey(search: ManagerRouteSearch): string {
  return filterPartitionKey(search, managerSearchPartition);
}

export function useManagerListFilter({
  search,
  onSearchChange,
}: {
  readonly search: ManagerRouteSearch;
  readonly onSearchChange: (next: ManagerRouteSearch) => void;
}) {
  const { t } = useTranslation('managers');
  const managerTypeOptions = useManagerTypeOptions();
  const committedKey = committedFilterKey(search);
  // 초안에는 필터만 보관한다. 확정된 정렬·페이지 상태를 다음 필터 입력이 덮어쓰지 않게 한다.
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: search,
    keyOf: committedFilterKey,
    createDraft: (value) =>
      filterPartitionValues(resolveManagerSearch(value), managerSearchPartition),
  });
  const keyword = useKeywordDraft<KeywordField>({
    committedItems: resolveManagerSearch(search).keywords.map((item) => ({
      field: item.keywordType,
      value: item.keyword,
    })),
    initialField: 'ID',
    resetKey: committedKey,
  });
  const period = usePeriodDraft({
    committed: resolveManagerSearch(search),
    resetKey: committedKey,
  });
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keywords = keyword.itemsIncludingPending().map((item) => ({
      keywordType: item.field,
      keyword: item.value,
    }));
    onSearchChange(
      toManagerRouteSearch(
        // 보기 조건은 확정 URL에서 읽고 초안은 필터 필드만 덮어쓴다.
        changeManagerView(
          {
            ...resolveManagerSearch(search),
            ...draft,
            ...period.utcRange,
            keywords,
          },
          {},
        ),
      ),
    );
  };
  // 운영자 URL은 기본 보기/검색 조건을 빈 객체로 표현한다.
  const reset = () => {
    resetDraft();
    period.reset();
    keyword.reset();
    onSearchChange({});
  };
  const keywordOptions = [
    { value: 'ID', label: t('filterOptions.id') },
    { value: 'NAME', label: t('filterOptions.name') },
    { value: 'PHONE', label: t('filterOptions.phone') },
    { value: 'ORGANIZATION', label: t('filterOptions.organization') },
    { value: 'PERMISSION', label: t('filterOptions.permission') },
  ] as const;

  return {
    draft,
    preset: period.preset,
    range: period.range,
    pendingKeyword: keyword.pending,
    keywordItems: keyword.items,
    patchDraft,
    setPendingKeywordField: keyword.setPendingField,
    setPendingKeywordValue: keyword.setPendingValue,
    addPendingKeyword: keyword.addPending,
    removeKeywordAt: keyword.removeAt,
    setRange: period.setRange,
    setPreset: period.setPreset,
    submit,
    reset,
    typeOptions: {
      state:
        managerTypeOptions.data !== undefined
          ? ('ready' as const)
          : managerTypeOptions.isError
            ? ('error' as const)
            : ('loading' as const),
      items: managerTypeOptions.data ?? [],
      retry: managerTypeOptions.refetch,
    },
    formatKeywordField: (field: KeywordField) =>
      keywordOptions.find((option) => option.value === field)?.label ?? field,
    options: {
      periodType: [
        { value: 'CREATED_AT', label: t('filterOptions.createdAt') },
        { value: 'UPDATED_AT', label: t('filterOptions.lastAccessAt') },
      ] as const,
      keywordType: keywordOptions,
      registrationRoute: [
        { value: 'ADMIN', label: t('filterOptions.web') },
        { value: 'APP', label: 'APP' },
      ],
      status: [
        { value: 'AWAITING', label: t('status.awaiting') },
        { value: 'INACTIVE', label: t('status.inactive') },
        { value: 'ACTIVE', label: t('status.active') },
        { value: 'LOCKED', label: t('status.locked') },
      ],
    },
  };
}
