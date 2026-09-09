import { TestLocaleProvider } from "@/test/locale";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PerformanceDetailScreen } from "./PerformanceDetailScreen";

function setup(id = "reference-performance-1") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onEdit = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <TestLocaleProvider>
        <PerformanceDetailScreen performanceId={id} onEdit={onEdit} />
      </TestLocaleProvider>
    </QueryClientProvider>,
  );
  return { client, onEdit };
}

describe("performance detail", () => {
  it("shows registered guidance, a download link and safe update lines", async () => {
    setup("reference-performance-2");
    const drawing = await screen.findByRole("link", {
      name: "reference-admission.txt",
    });
    expect(drawing).toHaveAttribute("download", "reference-admission.txt");
    expect(
      screen.queryByText("등록된 정보가 없습니다."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Reference Gate A")).toBeVisible();
    expect(screen.getByText("Reference Area A")).toBeVisible();
    const history = screen.getByRole("region", { name: "업데이트 이력" });
    expect(
      within(history).getByText("안내 도면: - > reference-admission.txt"),
    ).toBeVisible();
    expect(
      within(history).getByText("Reference Operator (reference-operator)"),
    ).toBeVisible();
  });
  it("loads directly, keeps translated content separate from UI locale, and sends the exact edit ID", async () => {
    const { onEdit } = setup();
    expect(
      await screen.findByRole("heading", { name: "공연 조회" }),
    ).toBeVisible();
    expect(await screen.findByText("등록된 정보가 없습니다.")).toBeVisible();
    expect(screen.getByText("Reference Performance 1")).toBeVisible();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "일본어" }), {
      button: 0,
    });
    expect(
      await screen.findByRole("tabpanel", { name: "일본어" }),
    ).toHaveTextContent("Reference Performance 1 (JA)");
    expect(screen.getByRole("heading", { name: "공연 조회" })).toBeVisible();
    expect(
      screen.queryByText("Reference Performance 1"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Reference Sound Check")).toBeVisible();
    expect(screen.getByText("Reference Hall A")).toBeVisible();
    expect(screen.getByText("Reference Grade A")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    expect(onEdit).toHaveBeenCalledWith("reference-performance-1");
    fireEvent.click(screen.getByRole("button", { name: "기본정보" }));
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("shows not-found with the title but no edit action for an unknown ID", async () => {
    setup("missing");
    expect(
      await screen.findByText("요청한 정보를 찾을 수 없습니다."),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "공연 조회" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "수정" }),
    ).not.toBeInTheDocument();
  });
});
