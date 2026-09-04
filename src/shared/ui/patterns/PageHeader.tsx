import type { ReactNode } from 'react';
export function PageHeader({
  breadcrumb,
  title,
  actions,
}: {
  breadcrumb?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-end justify-between">
      <div>
        {breadcrumb ? (
          <p className="mb-2 text-sm text-neutral-500">{breadcrumb}</p>
        ) : null}
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      {actions}
    </header>
  );
}
