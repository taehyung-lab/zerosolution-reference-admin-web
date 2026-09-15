import { chooseOptionIn } from "@/test/select";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@/shared/i18n/i18n";
import { ListResult, type ListResultData } from "./ListResult";
import { PageSizeControl } from "./PageSizeControl";
import { ResultSummary } from "./ResultSummary";
import { SortControl } from "./SortControl";
import { ResultToolbar } from "./ResultToolbar";
import { Pagination } from "./Pagination";

describe("list patterns", () => {
  const listData = <TRow,>(
    overrides: Partial<ListResultData<TRow>> = {},
  ): ListResultData<TRow> => ({
    rows: [],
    searched: true,
    isPending: false,
    isFetching: false,
    isError: false,
    retry: vi.fn(() => Promise.resolve(undefined)),
    ...overrides,
  });

  it("result toolbar only arranges feature-owned controls and actions", () => {
    render(
      <ResultToolbar
        left={
          <label>
            Rows{" "}
            <select aria-label="Rows">
              <option>100</option>
            </select>
          </label>
        }
        right={<button type="button">Create</button>}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Rows" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it.each([
    ["notSearched", listData({ searched: false }), "Enter search criteria"],
    ["loading", listData({ isPending: true }), "데이터를 불러오는 중입니다. 잠시만 기다려 주세요."],
    ["error", listData({ isError: true }), "Could not load list"],
    ["empty", listData(), "No results"],
    ["ready", listData({ rows: [{ id: "ready" }] }), "ready"],
  ] as const)("renders the %s result state centrally", (state, data, text) => {
    render(
      <I18nextProvider i18n={i18n}>
        <ListResult
          data={data}
          copy={{
            notSearched: "Enter search criteria",
            empty: "No results",
          }}
        >
          ready
        </ListResult>
      </I18nextProvider>,
    );

    if (state !== "error") expect(screen.getByText(text)).toBeInTheDocument();
    if (state !== "ready")
      expect(screen.queryByText("ready")).not.toBeInTheDocument();
  });

  it("renders ready content and its feature-owned footer", () => {
    render(
      <ListResult
        data={listData({ rows: [{ id: "ready" }], isFetching: true })}
        copy={{
          notSearched: "Initial",
          empty: "Empty",
        }}
        footer={<div>Pagination</div>}
      >
        Table
      </ListResult>,
    );

    expect(screen.getByText("Table")).toBeInTheDocument();
    expect(screen.getByText("Pagination")).toBeInTheDocument();
    expect(screen.getByText("Table")).toHaveAttribute("aria-busy", "true");
  });

  it("owns the live error, retry copy, and structured trace presentation", () => {
    const retry = vi.fn();
    // A feature may hand over its whole error object; only the three trace fields may render.
    const trace = {
      requestId: "req-1",
      status: 503,
      kind: "network",
      message: "raw server detail",
    };
    render(
      <I18nextProvider i18n={i18n}>
        <ListResult
          data={listData({
            isError: true,
            retry,
            trace,
          })}
          copy={{ notSearched: "Initial", empty: "Empty" }}
        >
          ready
        </ListResult>
      </I18nextProvider>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
    );
    expect(alert).toHaveTextContent("문의 코드: req-1");
    expect(alert).not.toHaveTextContent("raw server detail");
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("renders one list item per completed summary sentence and hides its separators", () => {
    render(
      <ResultSummary
        groups={[
          { key: "total", items: [{ key: "total", text: "Results: 1,234" }] },
          {
            key: "states",
            items: [
              { key: "waiting", text: "Waiting 500" },
              { key: "issued", text: "Issued 500" },
            ],
          },
          { key: "empty", items: [] },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Results: 1,234",
      "Waiting 500,",
      "Issued 500",
    ]);
    expect(screen.getByText(",")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("|")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByRole("list")).toHaveLength(2);
  });

  it("renders nothing when every summary group is empty", () => {
    const { container } = render(
      <ResultSummary groups={[{ key: "total", items: [] }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("anchors the first and last pages around the current window with one ellipsis", () => {
    render(
      <Pagination
        page={1}
        totalPages={68}
        onPageChange={vi.fn()}
        ariaLabel="Pagination"
        previousLabel="Previous"
        nextLabel="Next"
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect([...nav.children].map((child) => child.textContent)).toEqual([
      "Previous",
      "1",
      "2",
      "3",
      "\u2026",
      "67",
      "68",
      "Next",
    ]);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("collapses both gaps when the current page sits between the anchors", () => {
    render(
      <Pagination
        page={40}
        totalPages={68}
        onPageChange={vi.fn()}
        ariaLabel="Pagination"
        previousLabel="Previous"
        nextLabel="Next"
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect([...nav.children].map((child) => child.textContent)).toEqual([
      "Previous",
      "1",
      "2",
      "\u2026",
      "39",
      "40",
      "41",
      "\u2026",
      "67",
      "68",
      "Next",
    ]);
    expect(screen.getByRole("button", { name: "40" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("never marks another page as current when the requested page is out of range", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        page={999}
        totalPages={3}
        onPageChange={onPageChange}
        ariaLabel="Pagination"
        previousLabel="Previous"
        nextLabel="Next"
      />,
    );

    expect(
      screen.queryByRole("button", { current: "page" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("keeps page-size and sort policy in controlled feature props", async () => {
    const onPageSizeChange = vi.fn();
    const onSortChange = vi.fn();
    render(
      <>
        <PageSizeControl
          label="Rows"
          value={100}
          options={[50, 100]}
          onValueChange={onPageSizeChange}
        />
        <SortControl
          label="Sort"
          value="CREATED_AT"
          options={[{ value: "CREATED_AT", label: "Created at" }]}
          onValueChange={onSortChange}
        />
      </>,
    );
    await chooseOptionIn("Rows", "50");
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
    expect(
      screen.queryByRole("button", { name: /direction/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sort" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Rows" })).toHaveAccessibleName(
      "Rows",
    );
    expect(screen.getByText("Rows").tagName).toBe("SPAN");
  });
});
