import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@/shared/i18n/i18n";
import { AsyncFieldBoundary } from "./AsyncFieldBoundary";

function renderBoundary(
  state: "loading" | "error" | "ready",
  onRetry = vi.fn(),
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <span id="manager-type-label">유형</span>
      <AsyncFieldBoundary
        labelledBy="manager-type-label"
        state={state}
        onRetry={onRetry}
      >
        <div>options</div>
      </AsyncFieldBoundary>
    </I18nextProvider>,
  );
}

describe("AsyncFieldBoundary", () => {
  it("announces its shared loading copy under the field label", () => {
    renderBoundary("loading");

    expect(screen.getByRole("status", { name: "유형" })).toHaveTextContent(
      "옵션을 불러오는 중입니다.",
    );
    expect(screen.queryByText("options")).not.toBeInTheDocument();
  });

  it("renders an accessible shared error and retries", () => {
    const onRetry = vi.fn();
    renderBoundary("error", onRetry);

    expect(screen.getByRole("alert", { name: "유형" })).toHaveTextContent(
      "옵션을 불러오지 못했습니다.",
    );
    fireEvent.click(screen.getByRole("button", { name: "유형 다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders children only when ready", () => {
    renderBoundary("ready");

    expect(screen.getByText("options")).toBeInTheDocument();
  });
});
