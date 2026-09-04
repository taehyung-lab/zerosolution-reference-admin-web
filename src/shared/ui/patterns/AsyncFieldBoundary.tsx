import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type AsyncFieldState = "loading" | "error" | "ready";

/** Renders domain-neutral initial async field states; the feature decides the state. */
export function AsyncFieldBoundary({
  state,
  labelledBy,
  onRetry,
  children,
}: {
  readonly state: AsyncFieldState;
  readonly labelledBy: string;
  readonly onRetry: () => void;
  readonly children: ReactNode;
}) {
  const { t } = useTranslation("shared");
  const retryLabelId = useId();

  if (state === "loading") {
    return (
      <p aria-labelledby={labelledBy} role="status">
        {t("asyncField.loading")}
      </p>
    );
  }

  if (state === "error") {
    return (
      <div
        aria-labelledby={labelledBy}
        className="flex items-center gap-2"
        role="alert"
      >
        <span>{t("asyncField.error")}</span>
        <button
          aria-labelledby={`${labelledBy} ${retryLabelId}`}
          className="rounded border px-2 py-1"
          type="button"
          onClick={onRetry}
        >
          <span id={retryLabelId}>{t("asyncField.retry")}</span>
        </button>
      </div>
    );
  }

  return children;
}
