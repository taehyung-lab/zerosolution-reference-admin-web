import { useId } from 'react';
import { Select } from '../primitives/Select';

/** Controlled page-size UI. Options and reset policy remain feature-owned. */
export function PageSizeControl({ label, value, options, onValueChange }: {
  readonly label: string;
  readonly value: number;
  readonly options: readonly number[];
  readonly onValueChange: (value: number) => void;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  return (
    <div className="grid gap-1 text-sm">
      <span id={labelId}>{label}</span>
      <Select
        aria-labelledby={labelId}
        id={id}
        value={String(value)}
        options={options.map((option) => ({ value: String(option), label: String(option) }))}
        onValueChange={(next) => next !== null && onValueChange(Number(next))}
      />
    </div>
  );
}
