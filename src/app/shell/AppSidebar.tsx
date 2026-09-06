import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  memberNavigationItems,
  type AppNavigationItem,
} from "@/app/config/navigation";

export function AppSidebar({
  appName,
  items,
}: {
  readonly appName: string;
  readonly items: readonly AppNavigationItem[];
}) {
  const { t } = useTranslation("app");
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={
        collapsed
          ? "w-16 bg-neutral-800 text-white"
          : "w-52 bg-neutral-800 text-white"
      }
    >
      <div className="px-4 py-5 text-sm font-semibold">
        {collapsed ? appName.slice(0, 1) : appName}
      </div>
      <button
        className="mx-3 text-sm text-neutral-300"
        type="button"
        onClick={() => setCollapsed((current) => !current)}
      >
        <span aria-hidden="true">{collapsed ? "›" : "‹"}</span>
        <span className="sr-only">
          {t(collapsed ? "shell.expandNavigation" : "shell.collapseNavigation")}
        </span>
      </button>
      <nav aria-label={t("shell.navigation.label")}>
        <ul className="space-y-1 px-3">
          {items.map((item) => (
            <li key={item.id}>
              {item.to === undefined ? (
                <span
                  className="block rounded px-3 py-2 text-sm text-neutral-400"
                  aria-disabled="true"
                >
                  {collapsed ? t(item.labelKey).slice(0, 1) : t(item.labelKey)}
                </span>
              ) : (
                <Link
                  className="block rounded px-3 py-2 text-sm text-white hover:bg-neutral-700"
                  to={item.to}
                >
                  {collapsed ? t(item.labelKey).slice(0, 1) : t(item.labelKey)}
                </Link>
              )}
              {item.id === "members" && !collapsed ? (
                <ul className="ml-3 border-l border-neutral-600">
                  {memberNavigationItems.map((child) => (
                    <li key={child.id}>
                      <Link
                        className="block px-3 py-2 text-sm text-white hover:bg-neutral-700"
                        to={child.to}
                      >
                        {t(child.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
