import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@/shared/i18n/i18n";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("names the icon-only global search action with translated copy", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AppHeader appName="ZERO PLUS+" onSignOut={vi.fn()} />
      </I18nextProvider>,
    );

    expect(screen.getByRole("button", { name: "검색" })).toBeInTheDocument();
  });
});
