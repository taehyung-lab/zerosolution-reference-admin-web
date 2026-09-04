import { filterPartitionKey, filterPartitionValues } from "./search-partition";
import { useDraftCommit } from "@/shared/lib/use-draft-commit";
import { useKeywordDraft } from "@/shared/lib/use-keyword-draft";
import { usePeriodDraft } from "@/shared/lib/use-period-draft";
import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { useManagerTypeOptions } from "../options/useManagerOptions";
import { changeManagerView } from "./manager-list-policy";
import {
  managerSearchPartition,
  resolveManagerSearch,
  isManagerPeriodRangeOrdered,
  toManagerRouteSearch,
  type ManagerRouteSearch,
  type ManagerSearch,
} from "./search-schema";

type KeywordItem = ManagerSearch["keywords"][number];
type KeywordField = KeywordItem["keywordType"];

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
  const { t } = useTranslation("managers");
  const managerTypeOptions = useManagerTypeOptions();
  const committedKey = committedFilterKey(search);
  // The draft holds filter fields only, so view state can never be edited and then discarded.
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: search,
    keyOf: committedFilterKey,
    createDraft: (value) =>
      filterPartitionValues(
        resolveManagerSearch(value),
        managerSearchPartition,
      ),
  });
  const keyword = useKeywordDraft<KeywordField>({
    committedItems: resolveManagerSearch(search).keywords.map((item) => ({
      field: item.keywordType,
      value: item.keyword,
    })),
    initialField: "ID",
    resetKey: committedKey,
  });
  const period = usePeriodDraft({
    committed: resolveManagerSearch(search),
    resetKey: committedKey,
  });
  const periodRangeKey = `${period.range.from ?? ""}:${period.range.to ?? ""}`;
  const [invalidPeriodKey, setInvalidPeriodKey] = useState<string | null>(null);
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isManagerPeriodRangeOrdered(period.range.from, period.range.to)) {
      setInvalidPeriodKey(periodRangeKey);
      return;
    }
    setInvalidPeriodKey(null);
    const keywords = keyword.itemsIncludingPending().map((item) => ({
      keywordType: item.field,
      keyword: item.value,
    }));
    onSearchChange(
      toManagerRouteSearch(
        // View state comes from the committed search; the draft only overrides filters.
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
  // The Managers sparse-search contract uses `{}` for its default view and default query.
  const reset = () => {
    setInvalidPeriodKey(null);
    resetDraft();
    period.reset();
    keyword.reset();
    onSearchChange({});
  };
  const keywordOptions = [
    { value: "ID", label: t("filterOptions.id") },
    { value: "NAME", label: t("filterOptions.name") },
    { value: "PHONE", label: t("filterOptions.phone") },
    { value: "ORGANIZATION", label: t("filterOptions.organization") },
    { value: "PERMISSION", label: t("filterOptions.permission") },
  ] as const;

  return {
    draft,
    preset: period.preset,
    range: period.range,
    periodError:
      invalidPeriodKey === periodRangeKey
        ? t("filters.periodRangeOrderError")
        : undefined,
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
        { value: "CREATED_AT", label: t("filterOptions.createdAt") },
        { value: "UPDATED_AT", label: t("filterOptions.lastAccessAt") },
      ] as const,
      keywordType: keywordOptions,
      registrationRoute: [
        { value: "ADMIN", label: t("filterOptions.web") },
        { value: "APP", label: "APP" },
      ],
      status: [
        { value: "AWAITING", label: t("status.awaiting") },
        { value: "INACTIVE", label: t("status.inactive") },
        { value: "ACTIVE", label: t("status.active") },
        { value: "LOCKED", label: t("status.locked") },
      ],
    },
  };
}
