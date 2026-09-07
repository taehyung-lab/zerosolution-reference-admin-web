/**
 * 제품 운영자 목록의 기간·검색어·권한·유형·가입경로·상태 입력 UI다.
 * 입력과 옵션 조회 상태를 소비하고 조회 실행·URL 확정은 소유하지 않는다.
 * 서버가 주는 유형·권한 옵션은 AsyncFieldBoundary 안에서만 렌더해 실패를 빈 목록으로 숨기지 않는다.
 */
import { standardPeriodPresetValues } from "@/shared/config/list";
import { usePeriodPresets } from "@/shared/i18n/use-period-presets";
import { AsyncFieldBoundary } from "@/shared/ui/patterns/AsyncFieldBoundary";
import { FilterField } from "@/shared/ui/patterns/FilterField";
import { FilterPanel } from "@/shared/ui/patterns/FilterPanel";
import { KeywordFilterField } from "@/shared/ui/patterns/KeywordFilterField";
import { PeriodFilterField } from "@/shared/ui/patterns/PeriodFilterField";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { Select } from "@/shared/ui/primitives/Select";
import { useTranslation } from "react-i18next";
import type { useManagerDirectoryFilter } from "../model/useManagerDirectoryFilter";

export function ManagerDirectoryFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useManagerDirectoryFilter>;
}) {
  const { t } = useTranslation("managers");
  const standardPresets = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  return (
    <FilterPanel
      title={t("search")}
      submitLabel={t("search")}
      resetLabel={t("reset")}
      collapseLabel={t("filters.collapse")}
      expandLabel={t("filters.expand")}
      onReset={filter.reset}
      onSubmit={filter.submit}
    >
      <PeriodFilterField
        label={t("filters.period")}
        criterion={{
          label: t("filters.periodType"),
          value: draft.periodType,
          options: filter.options.periodType,
          onValueChange: (periodType) => patchDraft({ periodType }),
        }}
        preset={period.preset}
        presets={standardPresets.presets}
        customLabel={standardPresets.customLabel}
        presetGroupLabel={t("filters.periodPreset")}
        range={period.range}
        onPresetChange={period.setPreset}
        onRangeChange={period.setRange}
        fromLabel={t("filters.startDate")}
        toLabel={t("filters.endDate")}
        calendarLabel={t("filters.calendar")}
      />
      <KeywordFilterField
        label={t("filters.keyword")}
        field={{
          label: t("filters.keywordType"),
          value: keyword.pending.field,
          options: filter.options.keywordField,
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        addLabel={t("filters.add")}
        removeLabel={(item) => t("filters.remove", { value: item.value })}
        inputLabel={t("filters.keyword")}
        formatItem={(item) =>
          `${filter.formatKeywordField(item.field)} : ${item.value}`
        }
      />
      <FilterField label={t("form.permission")}>
        {({ labelId, controlId }) => (
          <AsyncFieldBoundary
            labelledBy={labelId}
            state={filter.permissionOptions.state}
            onRetry={filter.permissionOptions.retry}
          >
            <Select
              id={controlId}
              aria-labelledby={labelId}
              value={draft.permission || "all"}
              onValueChange={(value) =>
                patchDraft({ permission: value === "all" ? "" : (value ?? "") })
              }
              options={[
                { value: "all", label: t("filters.all") },
                ...filter.permissionOptions.items,
              ]}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t("filters.type")}>
        {({ labelId }) => (
          <AsyncFieldBoundary
            labelledBy={labelId}
            state={filter.typeOptions.state}
            onRetry={filter.typeOptions.retry}
          >
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t("filters.all")}
              nodes={filter.typeOptions.items}
              values={draft.types}
              emptyMeansAll
              onValueChange={(types) => patchDraft({ types })}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t("filters.registrationRoute")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={filter.options.registrationRoute}
            values={draft.registrationRoutes}
            emptyMeansAll
            onValueChange={(values) =>
              patchDraft({ registrationRoutes: values as ("WEB" | "APP")[] })
            }
          />
        )}
      </FilterField>
      <FilterField label={t("filters.status")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={filter.options.accountStatus}
            values={draft.statuses}
            emptyMeansAll
            onValueChange={(statuses) =>
              patchDraft({ statuses: statuses as typeof draft.statuses })
            }
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
