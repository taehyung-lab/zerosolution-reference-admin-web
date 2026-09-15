import type { ReactNode } from 'react';
export function ResultToolbar({
  left,
  right,
}: {
  readonly left?: ReactNode;
  readonly right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-end gap-4">{left}</div>
      <div className="flex gap-2">{right}</div>
    </div>
  );
}
