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
  return (
    <FilterField label={label} group>
      {() => (
        <>
          {criterion ? (
            <Select
              className="w-48"
              aria-label={criterion.label}
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
