import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { TestLocaleProvider } from "@/test/locale";
import {
  MemberActivitySection,
  type MemberActivitySearch,
} from "./MemberActivitySection";

const readyRows = [
  {
    id: "activity-1",
    occurredAt: "2026-09-01",
    performanceName: "공연",
    session: "1",
    performanceAt: "2026-09-01",
    bookingNumber: "B001",
    seatNumber: "A1",
  },
];
const readyData = {
  rows: readyRows,
  total: 201,
  searched: true,
  isPending: false,
  isFetching: false,
  isError: false,
  trace: undefined,
  retry: () => Promise.resolve(),
};

function setup() {
  const onSearch = vi.fn();
  const onDelete = vi.fn();
  function Host() {
    const [query, setQuery] = useState<MemberActivitySearch>({
      tab: "ticket",
      keyword: "",
      page: 1,
      pageSize: 100,
    });
    return (
      <MemberActivitySection
        query={query}
        onSearch={(next) => {
          setQuery(next);
          onSearch(next);
        }}
        onDelete={onDelete}
        data={readyData}
      />
    );
  }
  render(
    <TestLocaleProvider>
      <Host />
    </TestLocaleProvider>,
  );
  return { onSearch, onDelete };
}

describe("member activity request boundary", () => {
  it("checks selection, preserves cancel, and sends only confirmed target IDs", async () => {
    const { onDelete } = setup();
    fireEvent.click(screen.getByRole("button", { name: "선택삭제" }));
    expect(
      await screen.findByText("변경할 항목을 선택해주세요."),
    ).toBeVisible();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "확인" }),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "B001 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "선택삭제" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "취소",
      }),
    );
    expect(screen.getByRole("checkbox", { name: "B001 선택" })).toBeChecked();
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "선택삭제" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "확인",
      }),
    );
    expect(onDelete).toHaveBeenCalledExactlyOnceWith({
      tab: "ticket",
      ids: ["activity-1"],
    });
    expect(screen.getByRole("checkbox", { name: "B001 선택" })).toBeChecked();
    expect(screen.queryByText("삭제되었습니다.")).toBeNull();
  });

  it("commits a single search keyword and page size 100; draft changes preserve selection", () => {
    const { onSearch } = setup();
    fireEvent.click(screen.getByRole("checkbox", { name: "B001 선택" }));
    fireEvent.change(screen.getByRole("textbox", { name: "검색" }), {
      target: { value: " 공연 " },
    });
    expect(screen.getByRole("checkbox", { name: "B001 선택" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onSearch).toHaveBeenLastCalledWith({
      tab: "ticket",
      keyword: "공연",
      page: 1,
      pageSize: 100,
    });
    expect(
      screen.getByRole("checkbox", { name: "B001 선택" }),
    ).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(onSearch).toHaveBeenLastCalledWith({
      tab: "ticket",
      keyword: "공연",
      page: 2,
      pageSize: 100,
    });
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));
    expect(onSearch).toHaveBeenLastCalledWith({
      tab: "ticket",
      keyword: "",
      page: 1,
      pageSize: 100,
    });
    expect(screen.getByRole("textbox", { name: "검색" })).toHaveValue("");
  });

  it("supports keyboard tabs and excludes deletion from entry history", () => {
    const { onSearch } = setup();
    fireEvent.keyDown(screen.getByRole("tab", { name: "티켓인증" }), {
      key: "End",
    });
    expect(screen.getByRole("tab", { name: "입장기록" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "입장기록" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "선택삭제" })).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(onSearch).toHaveBeenLastCalledWith({
      tab: "entry",
      keyword: "",
      page: 1,
      pageSize: 100,
    });
    fireEvent.click(screen.getByRole("tab", { name: "재관람" }));
    expect(screen.getByRole("button", { name: "선택삭제" })).toBeVisible();
  });
});

describe("member activity load state", () => {
  const view = (data: typeof readyData) => (
    <TestLocaleProvider>
      <MemberActivitySection
        query={{ tab: "ticket", keyword: "", page: 1, pageSize: 100 }}
        onSearch={vi.fn()}
        onDelete={vi.fn()}
        data={data}
      />
    </TestLocaleProvider>
  );

  it("does not claim an empty history while the page is still loading", () => {
    render(view({ ...readyData, rows: [], total: 0, isPending: true }));
    expect(screen.queryByText("인증 기록이 없습니다.")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("데이터를 불러오는 중입니다. 잠시만 기다려 주세요.")).toBeVisible();
  });

  it("shows the failure with a retry instead of an empty history, then renders the recovered rows", () => {
    const retry = vi.fn(() => Promise.resolve());
    const { rerender } = render(
      view({ ...readyData, rows: [], total: 0, isError: true, retry }),
    );
    expect(screen.queryByText("인증 기록이 없습니다.")).toBeNull();
    const alert = screen.getByRole("alert");
    fireEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    expect(retry).toHaveBeenCalledOnce();
    rerender(view(readyData));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("checkbox", { name: "B001 선택" })).toBeVisible();
  });

  it("still says the history is empty when the query succeeded with no rows", () => {
    render(view({ ...readyData, rows: [], total: 0 }));
    expect(screen.getByText("인증 기록이 없습니다.")).toBeVisible();
  });
});
