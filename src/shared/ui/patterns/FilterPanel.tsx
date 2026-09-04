import { useId, useState, type ReactNode, type SubmitEvent } from "react";
export function FilterPanel({
  children,
  onSubmit,
  onReset,
  title,
  collapseLabel,
  expandLabel,
  submitLabel,
  resetLabel,
}: {
  children: ReactNode;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onReset: () => void;
  title: string;
  collapseLabel: string;
  expandLabel: string;
  submitLabel: string;
  resetLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const controlsId = `filter-panel-${useId()}`;
  return (
    <form
      aria-label={title}
      className="mb-5 rounded-lg border border-neutral-200 p-4"
      noValidate
      onSubmit={onSubmit}
    >
      {title ? (
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <strong>{title}</strong>
          <button
            aria-controls={controlsId}
            aria-expanded={!collapsed}
            aria-label={collapsed ? expandLabel : collapseLabel}
            type="button"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? "+" : "−"}
          </button>
        </div>
      ) : null}
      <div id={controlsId} hidden={collapsed}>
        <div className="grid gap-4">{children}</div>
        <div className="mt-4 flex justify-center gap-2">
          <button
            className="rounded bg-neutral-900 px-4 py-2 text-sm text-white"
            type="submit"
          >
            {submitLabel}
          </button>
          <button
            className="rounded border px-4 py-2 text-sm"
            type="button"
            onClick={onReset}
          >
            {resetLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
