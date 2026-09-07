import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { requestGlobalSearch, requestMyInfo } from './shell-requests';

export function AppHeader({
  appName,
  onSignOut,
}: {
  readonly appName: string;
  readonly onSignOut: () => Promise<void>;
}) {
  const { t } = useTranslation("app");
  const [globalSearch, setGlobalSearch] = useState("");

  const submitGlobalSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestGlobalSearch(globalSearch);
  };

  return (
    <header className="flex min-h-16 items-center gap-4 border-b border-neutral-200 px-6">
      <strong className="sr-only">{appName}</strong>
      <form className="flex max-w-md flex-1" onSubmit={submitGlobalSearch}>
        <label className="sr-only" htmlFor="app-global-search">
          {t("shell.globalSearch.label")}
        </label>
        <input
          id="app-global-search"
          className="w-full rounded-l border border-neutral-300 px-3 py-2 text-sm"
          value={globalSearch}
          placeholder={t("shell.globalSearch.placeholder")}
          onChange={(event) => setGlobalSearch(event.target.value)}
        />
        <button
          aria-label={t("shell.globalSearch.submit")}
          className="rounded-r border border-l-0 border-neutral-300 px-3"
          type="submit"
        >
          {"⌕"}
        </button>
      </form>
      <div className="ml-auto flex items-center gap-2 text-sm">
        <details>
          <summary className="cursor-pointer">{t("shell.profile")}</summary>
          <div className="absolute z-10 mt-2 rounded border bg-white p-2 shadow-sm">
            <button className="block px-2 py-1 text-left" type="button" onClick={requestMyInfo}>
              {t("shell.profileMenu.myInfo")}
            </button>
            <button
              className="block px-2 py-1 text-left"
              type="button"
              onClick={() => void onSignOut()}
            >
              {t("shell.profileMenu.signOut")}
            </button>
          </div>
        </details>
        {/* The field-ticketing destination is unconfirmed, so this is intentionally a disabled display slot. */}
        <button disabled type="button">
          {t("shell.fieldTicketing")}
        </button>
        {/* Notification delivery and read-state contracts are unconfirmed, so this is intentionally a disabled display slot. */}
        <button aria-label={t("shell.notifications")} disabled type="button">
          {"🔔"}
        </button>
      </div>
    </header>
  );
}
