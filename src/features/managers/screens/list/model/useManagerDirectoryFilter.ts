/**
 * 제품 운영자 목록의 필터 초안·기간·검색어와 URL 검색 확정을 연결한다.
 * 필드 의미·기본값·확정 시점은 이 훅이 소유하고 초안 보존 mechanic은 공용 훅에 맡긴다.
 * 옵션 목록은 조회 상태를 그대로 노출해 필드가 로딩·실패·재시도를 표시할 수 있게 한다.
 */
import { useListFilterDraft } from "@/shared/lib/use-list-filter-draft";
import { type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  managerListKeywordFields as keywordFields,
  managerListPeriodTypes as periodTypes,
  managerListRegistrationRoutes as registrationRoutes,
  managerListStatuses as accountStatuses,
  managerListSearchPartition,
  managerListSearchSchema,
  type ManagerListSort,
  type ManagerListRouteSearch,
  type ResolvedManagerListSearch,
} from "./manager-list-search";
import { useManagerDirectoryFilterOptions } from "./useManagerDirectoryFilterOptions";

export function useManagerDirectoryFilter({
  search,
  searched,
  onSearchChange,
}: {
  readonly search: ResolvedManagerListSearch;
  readonly searched: boolean;
  readonly onSearchChange: (next: ManagerListRouteSearch) => void;
}) {
  const { t } = useTranslation("managers");
  const inputs = useListFilterDraft({
    search,
    partition: managerListSearchPartition,
    scope: searched,
    keywords: search.keywords,
    initialKeywordField: keywordFields[0],
  });
  const { draft, patchDraft, period, keyword } = inputs;
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
      periodType: periodTypes.map((value) => ({
        value,
        label: sortLabel(value),
      })),
      keywordField: keywordFields.map((value) => ({
        value,
        label: sortLabel(value),
      })),
      registrationRoute: registrationRoutes.map((value) => ({
        value,
        label: value,
      })),
      accountStatus: accountStatuses.map((value) => ({
        value,
        label: t(`accountStatus.${value}`),
      })),
    },
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const input = inputs.prepareSubmit();
      onSearchChange(
        managerListSearchSchema.parse({
          ...search,
          searched: true,
          ...input.filters,
          ...input.range,
          keywords: [...input.keywords],
          page: undefined,
        }),
      );
    },
    /** 초기화는 기본값 복원이 아니라 검색 전 `{}`로의 복귀다. */
    reset: () => {
      inputs.resetDrafts();
      onSearchChange({});
    },
  };
}
