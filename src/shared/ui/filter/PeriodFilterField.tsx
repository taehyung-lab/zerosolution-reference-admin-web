import { useTranslation } from "react-i18next";
import { Select } from "../primitives/Select";
import { FilterField } from "./FilterField";
import type { FilterSelectSlot } from "./FilterSelectSlot";
import { PeriodField, type PeriodFieldProps } from "./PeriodField";

export function PeriodFilterField<TCriterion extends string>({
  label,
  criterion,
  ...period
}: PeriodFieldProps & {
  readonly label: string;
  readonly criterion?: FilterSelectSlot<TCriterion>;
}) {
  const { t } = useTranslation("shared");
  return (
    <FilterField label={label} group>
      {() => (
        <>
          {criterion ? (
            <Select
              className="w-48"
              aria-label={t("filter.period.criterion")}
              value={criterion.value}
              options={criterion.options}
              onValueChange={(value) =>
                value !== null && criterion.onValueChange(value as TCriterion)
              }
            />
          ) : null}
          <PeriodField {...period} />
        </>
      )}
    </FilterField>
  );
}
