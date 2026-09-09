import { TestLocaleProvider } from "@/test/locale";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  performanceVenues,
  readPerformancePage,
} from "../../../fixtures/performances";
import type { PerformanceRouteSearch } from "../model/search-schema";
import { PerformanceListScreen } from "./PerformanceListScreen";
import { performanceVenuesQuery } from "../../../api/queries";

const { readPage } = vi.hoisted(() => ({
  readPage: vi.fn<typeof readPerformancePage>(),
}));
vi.mock("../../../fixtures/performances", async (original) => ({
  ...(await original<{
    readPerformancePage: typeof readPerformancePage;
    performanceVenues: typeof performanceVenues;
  }>()),
  readPerformancePage: readPage,
}));
const row = {
  id: "show-1",
  ticketKind: "day",
  performanceType: "concert",
  title: "Reference show",
  sessionCount: 2,
  performers: "Performer",
  organizer: "Organizer",
  period: "2026-09-01",
  venueId: "venue-1",
  venueName: "Venue A",
  seller: "zero",
  registeredAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-02T00:00:00Z",
};
function setup(search: PerformanceRouteSearch = {}) {
  const onSearchChange = vi.fn<(value: PerformanceRouteSearch) => void>();
  const onActivate = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(performanceVenuesQuery("ko").queryKey, [
    { id: "venue-1", name: "Venue A" },
    { id: "venue-2", name: "Venue B" },
  ]);
  const view = (value: PerformanceRouteSearch) => (
    <QueryClientProvider client={client}>
      <TestLocaleProvider>
        <PerformanceListScreen
          search={value}
          onSearchChange={onSearchChange}
          onActivate={onActivate}
        />
      </TestLocaleProvider>
    </QueryClientProvider>
  );
  return { ...render(view(search)), view, onSearchChange, onActivate, client };
}
describe("performance list pre-request consumer", () => {
  beforeEach(() =>
    readPage.mockReset().mockResolvedValue({ rows: [row], total: 101 }),
  );
  it("returns to the Notion pre-search state on reset and resumes on submit", async () => {
    const { onSearchChange, rerender, view } = setup();
    await screen.findByRole("table");
    fireEvent.change(screen.getByRole("textbox", { name: "공연장 검색" }), {
      target: { value: "Venue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));
    rerender(view(onSearchChange.mock.calls.at(-1)![0]));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "기간 기준" }),
    ).toHaveTextContent("공연일");
    expect(screen.getByRole("radio", { name: "전체" })).toBeChecked();
    expect(screen.queryByText("검색결과 : 101")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "공연장 검색" })).toHaveValue(
      "",
    );
    fireEvent.change(screen.getByRole("textbox", { name: "공연장 검색" }), {
      target: { value: "Venue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));
    expect(screen.getByRole("textbox", { name: "공연장 검색" })).toHaveValue(
      "",
    );
    expect(
      screen.getByText("검색 조건을 설정한 후 검색해 주세요."),
    ).toBeInTheDocument();
    expect(readPage).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    rerender(view(onSearchChange.mock.calls.at(-1)![0]));
    await screen.findByRole("table");
    expect(readPage).toHaveBeenCalledTimes(2);
  });
  it("queries on entry without a search marker and renders a read-only reverse-numbered table", async () => {
    const { onActivate } = setup();
    const table = await screen.findByRole("table");
    expect(screen.getByRole("radio", { name: "전체" })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(8);
    expect(
      screen.getByRole("combobox", { name: "기간 기준" }),
    ).toHaveTextContent("공연일");
    expect(readPage).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 100,
        sortType: "registeredAt",
      }),
    );
    expect(readPage.mock.calls[0]![0].sortDirection).toBeUndefined();
    expect(within(table).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(table).getByText("101")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^(변경|등록|SMS|이메일)$/ }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(within(table).getAllByRole("row")[1]!, { key: "Enter" });
    expect(onActivate).toHaveBeenCalledWith("show-1");
  });
  it("offers all source-defined categories and sellers, committing selections on search", async () => {
    const { onSearchChange } = setup();
    await screen.findByRole("table");
    for (const label of [
      "콘서트",
      "뮤지컬",
      "전시",
      "페스티벌",
      "연극",
      "스포츠",
      "멤버십",
      "제로플러스",
      "멜론티켓",
      "티켓링크",
      "놀유니버스",
      "예스24",
      "기타",
    ]) {
      expect(screen.getByRole("checkbox", { name: label })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("checkbox", { name: "페스티벌" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "예스24" }));
    expect(onSearchChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    const submitted = onSearchChange.mock.calls.at(-1)![0];
    expect(submitted.performanceTypes).not.toContain("festival");
    expect(submitted.sellers).not.toContain("yes24");
    expect(screen.getByText("검색결과 : 101")).toBeInTheDocument();
  });
  it("replaces the sole venue draft and commits it only on search with page reset", async () => {
    const { onSearchChange, rerender, view } = setup({ page: 2 });
    await screen.findByRole("table");
    fireEvent.change(screen.getByRole("textbox", { name: "공연장 검색" }), {
      target: { value: "Venue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Venue A" }));
    expect(onSearchChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "공연장 선택 해제" }));
    fireEvent.change(screen.getByRole("textbox", { name: "공연장 검색" }), {
      target: { value: "Venue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Venue B" }));
    fireEvent.change(screen.getByRole("textbox", { name: "검색어" }), {
      target: { value: "pending" },
    });
    expect(readPage).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onSearchChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        venueId: "venue-2",
        keywords: [{ field: "title", value: "pending" }],
      }),
    );
    expect(onSearchChange.mock.calls.at(-1)![0].page).toBeUndefined();
    expect(onSearchChange.mock.calls.at(-1)![0]).not.toHaveProperty(
      "venueKeyword",
    );
    rerender(view(onSearchChange.mock.calls.at(-1)![0]));
    await waitFor(() => expect(readPage).toHaveBeenCalledTimes(2));
  });
});
