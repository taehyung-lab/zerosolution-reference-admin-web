import { useTranslation } from "react-i18next";
import { standardPeriodPresetValues } from "@/shared/config/list";
import { usePeriodPresetLabels } from "@/shared/i18n/use-period-preset-labels";
import { PeriodFilterField } from "@/shared/ui/patterns/PeriodFilterField";
import { KeywordFilterField } from "@/shared/ui/patterns/KeywordFilterField";
import type { useMemberRecordFilter } from "./useMemberRecordFilter";

export function MemberRecordFilterFields({
  filter,
  periodOptions,
  keywordOptions,
}: {
  readonly filter: ReturnType<typeof useMemberRecordFilter>;
  readonly periodOptions: readonly { value: string; label: string }[];
  readonly keywordOptions: readonly {
    value: "email" | "name" | "phone" | "content";
    label: string;
  }[];
}) {
  const { t } = useTranslation("members");
  const presets = usePeriodPresetLabels();
  return (
    <>
      <PeriodFilterField
        label={
          periodOptions.length === 1
            ? (periodOptions[0]?.label ?? t("filters.period"))
            : t("filters.period")
        }
        criterion={
          periodOptions.length === 1
            ? undefined
            : {
                label: t("filters.periodType"),
                value: filter.draft.periodType,
                options: periodOptions,
                onValueChange: (periodType) =>
                  filter.patchDraft({ periodType }),
              }
        }
        preset={filter.period.preset}
        presets={standardPeriodPresetValues.map((value) => ({
          value,
          label: presets[value],
        }))}
        customLabel={presets.CUSTOM}
        presetGroupLabel={t("filters.periodPreset")}
        range={filter.period.range}
        onPresetChange={filter.period.setPreset}
        onRangeChange={filter.period.setRange}
        fromLabel={t("filters.startDate")}
        toLabel={t("filters.endDate")}
        calendarLabel={t("filters.calendar")}
      />
      <KeywordFilterField
        label={t("filters.keyword")}
        field={{
          label: t("filters.keywordType"),
          value: filter.keyword.pending.field,
          options: keywordOptions,
          onValueChange: filter.keyword.setPendingField,
        }}
        items={filter.keyword.items}
        pendingValue={filter.keyword.pending.value}
        onPendingValueChange={filter.keyword.setPendingValue}
        onAdd={filter.keyword.addPending}
        onRemoveAt={filter.keyword.removeAt}
        addLabel={t("filters.add")}
        removeLabel={(item) => t("filters.remove", { value: item.value })}
        inputLabel={t("filters.keyword")}
        formatItem={(item) =>
          `${keywordOptions.find((option) => option.value === item.field)?.label ?? item.field}: ${item.value}`
        }
      />
    </>
  );
}
