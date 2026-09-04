import { Checkbox } from "./Checkbox";
// Unverified: retain until the second list screen (performance list) confirms this contract.
/**
 * Owns: controlled multi selection, first-label +N trigger and removable tokens.
 * Rejects: search/domain.
 * API: values, onValueChange, options.
 * Boundary: explicit MultiSelect contract (shared-ui-contract `multiselect.md`).
 */
export function MultiSelect({
  values,
  onValueChange,
  options,
  getRemoveLabel,
  id,
  ariaDescribedby,
  ariaInvalid,
  ariaLabelledby,
  onBlur,
}: {
  values: readonly string[];
  onValueChange: (values: string[]) => void;
  options: readonly { value: string; label: string }[];
  getRemoveLabel: (option: { value: string; label: string }) => string;
  id?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
  ariaLabelledby?: string;
  onBlur?: () => void;
}) {
  const selected = options.filter((option) => values.includes(option.value));
  return (
    <div>
      <details>
        <summary aria-describedby={ariaDescribedby} aria-invalid={ariaInvalid} aria-labelledby={ariaLabelledby} className="cursor-pointer rounded border px-3 py-2" id={id} onBlur={onBlur}>
          {selected[0]?.label ?? "—"}
          {selected.length > 1 ? ` +${selected.length - 1}` : ""}
        </summary>
        {options.map((option) => (
          <label key={option.value} className="flex gap-2 p-2">
            <Checkbox
              checked={values.includes(option.value)}
              onChange={(event) =>
                onValueChange(
                  event.target.checked
                    ? [...values, option.value]
                    : values.filter((value) => value !== option.value),
                )
              }
            />
            {option.label}
          </label>
        ))}
      </details>
      <div className="mt-2 flex gap-1">
        {selected.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-label={getRemoveLabel(option)}
            onClick={() =>
              onValueChange(values.filter((value) => value !== option.value))
            }
          >
            {option.label}
            {" ×"}
          </button>
        ))}
      </div>
    </div>
  );
}
