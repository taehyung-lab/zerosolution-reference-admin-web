import { useTranslation } from "react-i18next";
import { Select } from "../primitives/Select";
import { FilterField } from "./FilterField";
import type { FilterSelectSlot } from "./FilterSelectSlot";
import {
  KeywordChipField,
  type KeywordChipFieldProps,
} from "./KeywordChipField";

export function KeywordFilterField<TField extends string | undefined>({
  label,
  field,
  ...keyword
}: Omit<KeywordChipFieldProps<TField>, "ariaLabelledby"> & {
  readonly label: string;
  readonly field?: FilterSelectSlot<Exclude<TField, undefined>>;
}) {
  const { t } = useTranslation("shared");
  return (
    <FilterField label={label} group>
      {() => (
        <>
          {field ? (
            <Select
              className="w-48"
              aria-label={t("filter.keyword.field")}
              value={field.value}
              options={field.options}
              onValueChange={(value) =>
                value !== null &&
                field.onValueChange(value as Exclude<TField, undefined>)
              }
            />
          ) : null}
          <KeywordChipField {...keyword} />
        </>
      )}
    </FilterField>
  );
}
