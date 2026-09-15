import { standardPeriodPresetValues } from "@/shared/model/list-options";
import { usePeriodPresets } from "@/shared/i18n/use-period-presets";
import { AsyncFieldBoundary } from "@/shared/ui/feedback/AsyncFieldBoundary";
import { FilterField } from "@/shared/ui/filter/FilterField";
import { FilterPanel } from "@/shared/ui/filter/FilterPanel";
import { KeywordFilterField } from "@/shared/ui/filter/KeywordFilterField";
import { PeriodFilterField } from "@/shared/ui/filter/PeriodFilterField";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { InlineSearchSelect } from "@/shared/ui/primitives/InlineSearchSelect";
import { useTranslation } from "react-i18next";
import {
  performanceKeywordFields,
  performancePeriodTypes,
} from "../model/search-schema";
import type { usePerformanceListFilter } from "../model/usePerformanceListFilter";
import type { PerformanceVenueOptions } from "../../../api/usePerformanceVenues";

export function PerformanceListFilters({
  filter,
  venues,
}: {
  readonly filter: ReturnType<typeof usePerformanceListFilter>;
  readonly venues: PerformanceVenueOptions;
}) {
  const { t } = useTranslation("performances");
  const standardPresets = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;
  // TRANSPLANT_PENDING_PERFORMANCE_FILTER_OPTIONS: these observed labels are not server enum/wire values; replace sources with the real contract.
  return (
    <FilterPanel
      title={t("filters.title")}
      collapseLabel={t("filters.collapse")}
      expandLabel={t("filters.expand")}
      submitLabel={t("filters.search")}
      resetLabel={t("filters.reset")}
      onSubmit={filter.submit}
      onReset={filter.reset}
    >
      <PeriodFilterField
        label={t("filters.period")}
        criterion={{
          label: t("filters.periodType"),
          value: draft.periodType,
          options: performancePeriodTypes.map((value) => ({
            value,
            label: t(`fields.${value}`),
          })),
          onValueChange: (periodType) => patchDraft({ periodType }),
        }}
        preset={period.preset}
        presets={standardPresets.presets}
        customLabel={standardPresets.customLabel}
        presetGroupLabel={t("filters.preset")}
        range={period.range}
        onPresetChange={period.setPreset}
        onRangeChange={period.setRange}
        fromLabel={t("filters.from")}
        toLabel={t("filters.to")}
        calendarLabel={t("filters.calendar")}
      />
      <KeywordFilterField
        label={t("filters.keyword")}
        field={{
          label: t("filters.keywordType"),
          value: keyword.pending.field,
          options: performanceKeywordFields.map((value) => ({
            value,
            label: t(`fields.${value}`),
          })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        addLabel={t("filters.add")}
        inputLabel={t("filters.keyword")}
        removeLabel={(item) => t("filters.remove", { value: item.value })}
        formatItem={(item) => `${t(`fields.${item.field}`)}: ${item.value}`}
      />
      <FilterField label={t("fields.ticketKind")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={["day", "period"].map((value) => ({
              value,
              label: t(`options.${value}`),
            }))}
            values={draft.ticketKinds ?? []}
            selectAllLabel={t("filters.all")}
            onValueChange={(ticketKinds) => patchDraft({ ticketKinds })}
          />
        )}
      </FilterField>
      <FilterField label={t("fields.performanceType")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={[
              "concert",
              "musical",
              "exhibition",
              "festival",
              "theatre",
              "sports",
              "membership",
            ].map((value) => ({
              value,
              label: t(`options.${value}`),
            }))}
            values={draft.performanceTypes ?? []}
            selectAllLabel={t("filters.all")}
            onValueChange={(performanceTypes) =>
              patchDraft({ performanceTypes })
            }
          />
        )}
      </FilterField>
      <FilterField label={t("filters.venue")} group>
        {({ controlId, labelId }) => (
          <AsyncFieldBoundary
            state={
              venues.isError ? "error" : venues.isPending ? "loading" : "ready"
            }
            labelledBy={labelId}
            onRetry={venues.onRetry}
          >
            <InlineSearchSelect
              id={controlId}
              value={draft.venueId}
              selectedLabel={
                venues.items.find(({ id }) => id === draft.venueId)?.name ??
                t("filters.venue")
              }
              options={venues.items.map(({ id, name }) => ({
                value: id,
                label: name,
              }))}
              onValueChange={(venueId) => patchDraft({ venueId })}
              searchValue={draft.venueKeyword}
              onSearchValueChange={(venueKeyword) =>
                patchDraft({ venueKeyword })
              }
              searchLabel={t("filters.venueSearch")}
              placeholder={t("filters.venueSearch")}
              clearLabel={t("filters.clearVenue")}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t("fields.seller")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={["zero", "melon", "ticketlink", "nol", "yes24", "other"].map(
              (value) => ({
                value,
                label: t(`options.${value}`),
              }),
            )}
            values={draft.sellers ?? []}
            selectAllLabel={t("filters.all")}
            onValueChange={(sellers) => patchDraft({ sellers })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
