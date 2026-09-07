/**
 * 제품 운영자 목록의 필터 초안·기간·검색어와 URL 검색 확정을 연결한다.
 * 필드 의미·기본값·확정 시점은 이 훅이 소유하고 초안 보존 mechanic은 공용 훅에 맡긴다.
 * 옵션 목록은 조회 상태를 그대로 노출해 필드가 로딩·실패·재시도를 표시할 수 있게 한다.
 */
import { useTranslation } from 'react-i18next';
import { type SubmitEvent } from 'react';
import { useDraftCommit } from '@/shared/lib/use-draft-commit';
import { useKeywordDraft } from '@/shared/lib/use-keyword-draft';
import { usePeriodDraft } from '@/shared/lib/use-period-draft';
import {
  managerListFilter,
  managerListSearchSchema,
  type ManagerListSearch,
  type ManagerListSort,
} from './manager-list-search';
import { useManagerDirectoryFilterOptions } from './useManagerDirectoryFilterOptions';

/** 검색어 구분은 제품 화면 값이며 서버 enum으로 확정하지 않는다. */
const keywordFields = ['id', 'name', 'phone', 'email'] as const;
const periodTypes = ['joinedAt', 'lastAccessAt'] as const;
const registrationRoutes = ['WEB', 'APP'] as const;
const accountStatuses = ['awaiting', 'rejected', 'active', 'inactive', 'locked'] as const;

type ManagerDirectoryKeywordField = (typeof keywordFields)[number];

export function useManagerDirectoryFilter({
  search,
  onSearchChange,
}: {
  readonly search: ManagerListSearch;
  readonly onSearchChange: (next: ManagerListSearch) => void;
}) {
  const { t } = useTranslation('managers');
  const filterKey = JSON.stringify(managerListFilter(search));
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: search,
    keyOf: (value) => JSON.stringify(managerListFilter(value)),
    createDraft: managerListFilter,
  });
  const period = usePeriodDraft({ committed: search, resetKey: filterKey });
  const keyword = useKeywordDraft<ManagerDirectoryKeywordField>({
    committedItems: search.keywords ?? [],
    initialField: 'id',
    resetKey: filterKey,
  });
  const options = useManagerDirectoryFilterOptions();
  /** 기간 기준·검색어 구분·정렬 라벨은 같은 필드 이름을 쓰므로 한 번역 묶음에서 읽는다. */
  const sortLabel = (value: ManagerListSort) => t(`scenarioSort.${value}`);

  return {
    draft,
    patchDraft,
    period,
    keyword,
    typeOptions: options.type,
    permissionOptions: options.permission,
    formatKeywordField: sortLabel,
    options: {
      periodType: periodTypes.map((value) => ({ value, label: sortLabel(value) })),
      keywordField: keywordFields.map((value) => ({ value, label: sortLabel(value) })),
      registrationRoute: registrationRoutes.map((value) => ({ value, label: value })),
      accountStatus: accountStatuses.map((value) => ({
        value,
        label: t(`accountStatus.${value}`),
      })),
    },
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSearchChange(
        managerListSearchSchema.parse({
          ...search,
          ...draft,
          ...period.utcRange,
          keywords: [...keyword.itemsIncludingPending()],
          page: undefined,
        }),
      );
    },
    /** 초기화는 기본값 복원이 아니라 검색 전 `{}`로의 복귀다. */
    reset: () => {
      resetDraft();
      period.reset();
      keyword.reset();
      onSearchChange({});
    },
  };
}
