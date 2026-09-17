import { render, screen } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@/shared/i18n/i18n";
import { AppHeader } from "./AppHeader";

/** 헤더의 `내 정보` 는 route 로 가는 링크라 실제 Router 위에서만 렌더된다. */
function renderHeader() {
  const root = createRootRoute({ component: () => <Outlet /> });
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <AppHeader appName="ZERO PLUS+" onSignOut={vi.fn()} />,
  });
  const profile = createRoute({ getParentRoute: () => root, path: "/profile", component: () => <h1>내정보</h1> });
  render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider
        router={createRouter({
          routeTree: root.addChildren([home, profile]),
          history: createMemoryHistory({ initialEntries: ["/"] }),
        })}
      />
    </I18nextProvider>,
  );
}

describe("AppHeader", () => {
  it("names the icon-only global search action with translated copy", async () => {
    renderHeader();

    expect(await screen.findByRole("button", { name: "검색" })).toBeInTheDocument();
  });

  it("내 정보 메뉴가 내정보 화면으로 가는 링크다", async () => {
    renderHeader();

    const link = await screen.findByRole("link", { name: "내 정보" });
    expect(link).toHaveAttribute("href", "/profile");
  });
});
