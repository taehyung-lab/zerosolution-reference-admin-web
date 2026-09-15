import type { ReactNode } from 'react';

/** Owns only the repeated label/value surface used by detail screens. */
export function DetailField({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-b py-3 text-sm">
      <dt className="font-medium">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
