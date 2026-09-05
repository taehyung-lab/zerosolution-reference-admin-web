import { useState, type ReactNode, type SubmitEvent } from "react";
import { Accordion } from "../primitives/Accordion";
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
  return (
    <form
      aria-label={title}
      className="mb-5 rounded-lg border border-neutral-200 p-4"
      noValidate
      onSubmit={onSubmit}
    >
      <Accordion
        open={!collapsed}
        keepMounted
        onOpenChange={(open) => setCollapsed(!open)}
        triggerAriaLabel={collapsed ? expandLabel : collapseLabel}
        trigger={(
          <span className="flex items-center justify-between">
            <strong>{title}</strong>
            <span aria-hidden="true">{collapsed ? "+" : "−"}</span>
          </span>
        )}
        headerClassName="mb-4 border-b pb-3"
      >
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
      </Accordion>
    </form>
  );
}
