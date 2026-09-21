import { useTranslation } from "react-i18next";
import { Calendar } from "../primitives/Calendar";
import { Popover } from "../primitives/Popover";
import { RadioGroup, RadioGroupItem } from "../primitives/RadioGroup";
import type { DateRange, PeriodValue } from "@/shared/lib/datetime";

export interface PeriodFieldProps {
  readonly preset: PeriodValue;
  readonly presets: readonly {
    readonly value: Exclude<PeriodValue, "CUSTOM">;
    readonly label: string;
  }[];
  readonly customLabel: string;
  readonly onPresetChange: (preset: PeriodValue) => void;
  readonly range: DateRange;
  readonly onRangeChange: (range: DateRange) => void;
}

export function PeriodField({
  preset,
  presets,
  customLabel,
  onPresetChange,
  range,
  onRangeChange,
}: PeriodFieldProps) {
  // The two date inputs, the calendar trigger and the preset group are this field's own
  // controls, so their accessible names are the product's shared words; the preset labels
  // arrive from the caller because which presets exist is product config.
  const { t } = useTranslation("shared");
  const fromLabel = t("filter.period.from");
  const toLabel = t("filter.period.to");
  const calendarLabel = t("filter.period.calendar");
  const presetGroupLabel = t("filter.period.presets");

  return (
    <div className="flex flex-wrap items-start gap-2">
      <RadioGroup
        label={presetGroupLabel}
        value={preset}
        onValueChange={(value) => onPresetChange(value as PeriodValue)}
      >
        {presets.map(({ value, label }) => (
          <RadioGroupItem key={value} value={value}>
            {label}
          </RadioGroupItem>
        ))}
      </RadioGroup>
      <div>
        <div
          className="flex min-h-10 items-center rounded border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-neutral-900"
        >
          <input
            aria-label={fromLabel}
            className="min-h-9 w-36 border-0 bg-transparent px-2 text-sm outline-none"
            max={range.to}
            type="date"
            value={range.from ?? ""}
            onChange={(event) =>
              onRangeChange({ ...range, from: event.target.value || undefined })
            }
          />
          <span aria-hidden="true" className="text-neutral-400">~</span>
          <input
            aria-label={toLabel}
            className="min-h-9 w-36 border-0 bg-transparent px-2 text-sm outline-none"
            min={range.from}
            type="date"
            value={range.to ?? ""}
            onChange={(event) =>
              onRangeChange({ ...range, to: event.target.value || undefined })
            }
          />
          <Popover
            contentLabel={customLabel}
            trigger={
              <button
                aria-label={calendarLabel}
                className="min-h-9 border-l border-neutral-200 px-3"
                type="button"
              >
                <span aria-hidden="true">📅</span>
              </button>
            }
          >
            <div className="flex gap-2">
              <div role="group" aria-label={fromLabel}>
                <Calendar
                  max={range.to}
                  value={range.from}
                  onValueChange={(from) => onRangeChange({ ...range, from })}
                />
              </div>
              <div role="group" aria-label={toLabel}>
                <Calendar
                  min={range.from}
                  value={range.to}
                  onValueChange={(to) => onRangeChange({ ...range, to })}
                />
              </div>
            </div>
          </Popover>
        </div>
      </div>
    </div>
  );
}
