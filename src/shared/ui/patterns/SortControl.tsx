import { useId } from 'react';
import { Select } from '../primitives/Select';

/**
 * Controlled server-sort field select. Sort fields, direction, and URL behavior remain
 * feature-owned; the product design shows no standalone direction control on any list, so the
 * direction toggle lives on the sorted column header.
 */
export function SortControl<TValue extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  readonly label: string;
  readonly value: TValue;
  readonly options: readonly { readonly value: TValue; readonly label: string }[];
  readonly onValueChange: (value: TValue) => void;
}) {
  const labelId = useId();
  return (
    <div className="grid gap-1 text-sm">
      <span id={labelId}>{label}</span>
      <Select
        aria-labelledby={labelId}
        value={value}
        options={options}
        onValueChange={(next) => next !== null && onValueChange(next as TValue)}
      />
    </div>
  );
}
