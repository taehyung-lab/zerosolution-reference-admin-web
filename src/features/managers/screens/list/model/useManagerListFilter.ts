import {
  managerPeriodTypes,
  managerRegistrationRouteTypes,
  managerStatuses,
} from "../../../api/manager-list-contract";
/**
 * 기존 API 운영자 목록의 필터 초안·기간·검색어와 URL 검색 확정을 연결한다.
 * 실제 API에서도 필요한 입력 workflow다. 서버 enum에 의존하는 기본값은 계약 교체 때 재검토한다.
 */
import { useListFilterDraft } from "@/shared/lib/use-list-filter-draft";
import { type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { type ManagerSearch } from "../../../api/manager-search";
import { useManagerTypeOptions } from "../../../api/useManagerOptions";
import { changeManagerView } from "./manager-list-policy";
import {
  managerSearchPartition,
  managerKeywordTypes,
  toManagerRouteSearch,
  type ManagerRouteSearch,
} from "./search-schema";

type KeywordItem = ManagerSearch["keywords"][number];
type KeywordField = KeywordItem["keywordType"];

export function useManagerListFilter({
  search,
  searched,
  onSearchChange,
}: {
  readonly search: ManagerSearch;
  readonly searched: boolean;
  readonly onSearchChange: (next: ManagerRouteSearch) => void;
}) {
  const { t } = useTranslation("managers");
  const managerTypeOptions = useManagerTypeOptions();
  const inputs = useListFilterDraft({
    search,
    partition: managerSearchPartition,
    scope: searched,
    keywords: search.keywords.map((item) => ({
      field: item.keywordType,
      value: item.keyword,
    })),
    initialKeywordField: managerKeywordTypes[0],
  });
  const { draft, patchDraft, period, keyword } = inputs;
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = inputs.prepareSubmit();
    const keywords = input.keywords.map((item) => ({
      keywordType: item.field,
      keyword: item.value,
    }));
    onSearchChange(
      toManagerRouteSearch(
        // 보기 조건은 확정 URL에서 읽고 초안은 필터 필드만 덮어쓴다.
        changeManagerView(
          {
            ...search,
            ...input.filters,
            ...input.range,
            keywords,
          },
          {},
        ),
      ),
    );
  };
  // 운영자 URL은 기본 보기/검색 조건을 빈 객체로 표현한다.
  const reset = () => {
    inputs.resetDrafts();
    onSearchChange({});
  };
  const keywordLabels = {
    ID: t("filterOptions.id"),
    NAME: t("filterOptions.name"),
    PHONE: t("filterOptions.phone"),
    ORGANIZATION: t("filterOptions.organization"),
    PERMISSION: t("filterOptions.permission"),
  };
  const keywordOptions = managerKeywordTypes.map((value) => ({
    value,
    label: keywordLabels[value],
  }));

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
          ? ("ready" as const)
          : managerTypeOptions.isError
            ? ("error" as const)
            : ("loading" as const),
      items: managerTypeOptions.data ?? [],
      retry: managerTypeOptions.refetch,
    },
    formatKeywordField: (field: KeywordField) =>
      keywordOptions.find((option) => option.value === field)?.label ?? field,
    options: {
      periodType: [
        {
          value: managerPeriodTypes.CREATED_AT,
          label: t("filterOptions.createdAt"),
        },
        {
          value: managerPeriodTypes.UPDATED_AT,
          label: t("filterOptions.lastAccessAt"),
        },
      ],
      keywordType: keywordOptions,
      registrationRoute: [
        {
          value: managerRegistrationRouteTypes.ADMIN,
          label: t("filterOptions.web"),
        },
        { value: managerRegistrationRouteTypes.APP, label: "APP" },
      ],
      status: [
        { value: managerStatuses.AWAITING, label: t("status.awaiting") },
        { value: managerStatuses.INACTIVE, label: t("status.inactive") },
        { value: managerStatuses.ACTIVE, label: t("status.active") },
        { value: managerStatuses.LOCKED, label: t("status.locked") },
      ],
    },
  };
}
