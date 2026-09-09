import { ApiError } from "@/api/error";
import { TestLocaleProvider } from "@/test/locale";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { performanceVenuesQuery } from "../../../api/queries";
import {
  readPerformancePage,
  readPerformanceVenues,
} from "../../../fixtures/performances";
import { PerformanceListScreen } from "./PerformanceListScreen";
vi.mock(import("../../../fixtures/performances"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readPerformancePage: vi.fn(actual.readPerformancePage),
    readPerformanceVenues: vi.fn(actual.readPerformanceVenues),
  };
});

afterEach(() => vi.resetAllMocks());

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TestLocaleProvider>
        <PerformanceListScreen
          search={{}}
          onSearchChange={vi.fn()}
          onActivate={vi.fn()}
        />
      </TestLocaleProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe("performance venue option supply", () => {
  it("reads the venue options from the feature query when the caller injects none", async () => {
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    setup();
    fireEvent.change(
      await screen.findByRole("textbox", { name: "공연장 검색" }),
      { target: { value: "Reference" } },
    );
    expect(
      await screen.findByRole("button", { name: "Reference Hall A" }),
    ).toBeVisible();
    expect(vi.mocked(readPerformanceVenues)).toHaveBeenCalledOnce();
  });

  it("shows the failed option read with a retry instead of an empty venue list, then recovers", async () => {
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    const read = vi
      .mocked(readPerformanceVenues)
      .mockRejectedValueOnce(
        new ApiError({ kind: "network", message: "test" }),
      );
    setup();
    expect(
      await screen.findByText("옵션을 불러오지 못했습니다."),
    ).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "공연장 검색" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "공연장 다시 시도" }));
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByText("옵션을 불러오지 못했습니다.")).toBeNull(),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "공연장 검색" }), {
      target: { value: "Reference" },
    });
    expect(
      await screen.findByRole("button", { name: "Reference Hall B" }),
    ).toBeVisible();
  });

  it("reuses warmed venue options without a duplicate read on mount", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    vi.mocked(readPerformanceVenues).mockResolvedValue([
      { id: "warmed", name: "Warmed Hall" },
    ]);
    await client.query(performanceVenuesQuery("ko"));
    render(
      <QueryClientProvider client={client}>
        <TestLocaleProvider>
          <PerformanceListScreen
            search={{}}
            onSearchChange={vi.fn()}
            onActivate={vi.fn()}
          />
        </TestLocaleProvider>
      </QueryClientProvider>,
    );
    fireEvent.change(
      await screen.findByRole("textbox", { name: "공연장 검색" }),
      { target: { value: "Warmed" } },
    );
    expect(
      await screen.findByRole("button", { name: "Warmed Hall" }),
    ).toBeVisible();
    expect(vi.mocked(readPerformanceVenues)).toHaveBeenCalledOnce();
    expect(screen.queryByText("옵션을 불러오는 중입니다.")).toBeNull();
  });
});

describe("performance venue option refresh", () => {
  it("keeps the loaded venue chooser usable when a later refresh fails", async () => {
    vi.mocked(readPerformancePage).mockResolvedValue({ rows: [], total: 0 });
    const read = vi.mocked(readPerformanceVenues);
    const client = setup();
    fireEvent.change(
      await screen.findByRole("textbox", { name: "공연장 검색" }),
      { target: { value: "Reference" } },
    );
    expect(
      await screen.findByRole("button", { name: "Reference Hall A" }),
    ).toBeVisible();
    read.mockRejectedValueOnce(
      new ApiError({ kind: "network", message: "refresh" }),
    );
    await act(async () => {
      await client.refetchQueries({
        queryKey: performanceVenuesQuery("ko").queryKey,
      });
    });
    expect(read).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("옵션을 불러오지 못했습니다.")).toBeNull();
    expect(screen.getByRole("textbox", { name: "공연장 검색" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Reference Hall A" }),
    ).toBeVisible();
  });
});
