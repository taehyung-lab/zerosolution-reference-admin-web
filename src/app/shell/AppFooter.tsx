import { useTranslation } from "react-i18next";
import { useLocale } from "@/shared/i18n/locale-context";
import { UI_LOCALES } from "@/shared/i18n/locale";

export function AppFooter() {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation("app");
  return (
    <footer className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 text-sm text-neutral-500">
      <span>{t("shell.copyright")}</span>
      <label>
        <span className="sr-only">{t("shell.locale.label")}</span>
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as typeof locale)}
        >
          {UI_LOCALES.map((value) => (
            <option key={value} value={value}>
              {t(`shell.locale.${value}`)}
            </option>
          ))}
        </select>
      </label>
    </footer>
  );
}
