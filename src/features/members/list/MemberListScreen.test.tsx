import { fireEvent, render as renderUi, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { TestQueryLocaleProvider } from "@/test/query-locale";
import { describe, expect, it, vi } from "vitest";
import {
  AllMemberListScreen,
  FlaggedMemberListScreen,
  GeneralMemberListScreen,
} from "./MemberListScreen";

function I18nWrapper({ children }: { readonly children: ReactNode }) {
  return <TestQueryLocaleProvider>{children}</TestQueryLocaleProvider>;
}

const render = (ui: ReactElement) => renderUi(ui, { wrapper: I18nWrapper });

const baseProps = {
  search: { periodType: "joinedAt" as const },
  onSearchChange: vi.fn(),
  onMemberActivate: vi.fn(),
  onRegister: vi.fn(),
  onActionRequest: vi.fn(),
};

describe("active member list screens", () => {
  it("keeps the three route identities and their filter differences explicit", () => {
    const { rerender } = render(<AllMemberListScreen {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: "전체회원" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "계정 상태" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "활동제한" })).toBeInTheDocument();

    rerender(<GeneralMemberListScreen {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: "일반회원" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "계정 상태" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "활동제한" }),
    ).not.toBeInTheDocument();

    rerender(<FlaggedMemberListScreen {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: "불량회원" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "계정 상태" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "활동제한" })).toBeInTheDocument();
  });

  it("shows only the registration action before search and commits defaults once", () => {
    const onSearchChange = vi.fn();
    render(
      <AllMemberListScreen
        {...baseProps}
        search={{}}
        onSearchChange={onSearchChange}
      />,
    );

    expect(screen.getByText("검색해주세요.")).toBeInTheDocument();
    expect(screen.queryByText("검색결과 : 0")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onSearchChange).toHaveBeenCalledWith({ periodType: "joinedAt" });
  });

  // Notion states `다중 키워드 허용` on 30 list screens and never states the opposite.
  it("keeps every keyword added against the same target", () => {
    render(<AllMemberListScreen {...baseProps} search={{}} />);
    const keyword = screen.getByRole("textbox", { name: "검색어" });
    fireEvent.change(keyword, { target: { value: "first@example.com" } });
    fireEvent.keyDown(keyword, { key: "Enter" });
    fireEvent.change(keyword, { target: { value: "second@example.com" } });
    fireEvent.keyDown(keyword, { key: "Enter" });

    expect(
      screen.getByRole("button", { name: /first@example.com/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /second@example.com/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears the stale bound when a typed date would reverse the range", () => {
    render(<AllMemberListScreen {...baseProps} search={{}} />);
    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: "2026-09-05" },
    });
    fireEvent.change(screen.getByLabelText("종료일"), {
      target: { value: "2026-09-01" },
    });

    expect(screen.getByLabelText("시작일")).toHaveValue("");
    expect(screen.getByLabelText("종료일")).toHaveValue("2026-09-01");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // A view-only commit must not be undone by a filter draft built before it.
  it("keeps the committed sort and page size when the filter panel is submitted again", () => {
    const onSearchChange = vi.fn();
    const { rerender } = render(
      <AllMemberListScreen
        {...baseProps}
        search={{ periodType: "joinedAt" }}
        onSearchChange={onSearchChange}
      />,
    );
    rerender(
      <AllMemberListScreen
        {...baseProps}
        search={{ periodType: "joinedAt", sortType: "name", pageSize: 200 }}
        onSearchChange={onSearchChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    expect(onSearchChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortType: "name", pageSize: 200 }),
    );
  });
});
