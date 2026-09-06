import { useTranslation } from "react-i18next";

export function DevelopmentNotice({
  ready = false,
}: {
  readonly ready?: boolean;
}) {
  const { t } = useTranslation("app");
  return (
    <p
      role="status"
      className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm"
    >
      {t(ready ? "reference.ready" : "reference.notice")}
    </p>
  );
}
