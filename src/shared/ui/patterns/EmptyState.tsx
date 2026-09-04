import type { ReactNode } from 'react';
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded border border-dashed p-10 text-center text-sm text-neutral-600">
      {children}
    </div>
  );
}
