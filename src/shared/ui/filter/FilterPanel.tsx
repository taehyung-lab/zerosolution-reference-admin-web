import { useState, type ReactNode, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { Accordion } from "../primitives/Accordion";

/**
 * The search panel every list opens with: a collapsible form whose title, collapse/expand
 * names and search/reset buttons are the product's one set of words (`shared:filter.*`).
 * What sits inside, and what submit and reset commit to, belong to the caller.
 */
export function FilterPanel({
  children,
  onSubmit,
  onReset,
}: {
  children: ReactNode;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onReset: () => void;
}) {
  const { t } = useTranslation("shared");
  const title = t("filter.title");
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
        triggerAriaLabel={collapsed ? t("filter.expand") : t("filter.collapse")}
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
            {t("filter.submit")}
          </button>
          <button
            className="rounded border px-4 py-2 text-sm"
            type="button"
            onClick={onReset}
          >
            {t("filter.reset")}
          </button>
        </div>
      </Accordion>
    </form>
  );
}
