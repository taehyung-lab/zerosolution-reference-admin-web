import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TestLocaleProvider } from "@/test/locale";
import { MemberAccessListScreen } from "./MemberAccessListScreen";
import { WithdrawnMemberListScreen } from "../withdrawn/WithdrawnMemberListScreen";
import type { MemberRecordSearch } from "../records/member-record-search";

vi.mock("../records/member-record-data", () => ({
  accessData: () => ({
    rows: [
      {
        id: "access-1",
        grade: "VIP",
        email: "member@example.com",
        name: "Member",
        phone: "01012345678",
        accountStatus: "general",
        accessedAt: "2026-09-01T00:00:00Z",
        accessPath: "app",
      },
    ],
    total: 2,
    page: 1,
    totalPages: 2,
  }),
  withdrawnData: () => ({
    rows: [
      {
        id: "withdrawn-1",
        email: "member@example.com",
        signupMethod: "direct",
        accountStatus: "general",
        joinedAt: "2026-01-01T00:00:00Z",
        lastAccessedAt: "2026-08-01T00:00:00Z",
        withdrawnAt: "2026-09-01T00:00:00Z",
        reason: "Example",
      },
    ],
    total: 1,
    page: 1,
    totalPages: 1,
  }),
}));

function choose(label: string, option: string) {
  fireEvent.keyDown(screen.getByRole("combobox", { name: label }), {
    key: "ArrowDown",
  });
  fireEvent.click(screen.getByRole("option", { name: option }));
}

describe("member access and withdrawn list boundaries", () => {
  it("preserves selection while editing a draft and clears it after committed view changes", () => {
    const onDownload = vi.fn();
    const view = (search: MemberRecordSearch) => (
      <TestLocaleProvider>
        <MemberAccessListScreen
          search={search}
          onSearchChange={vi.fn()}
          onRegister={vi.fn()}
          onDownload={onDownload}
        />
      </TestLocaleProvider>
    );
    const { rerender } = render(view({ periodType: "accessedAt" }));
    const selected = within(screen.getByRole("table")).getAllByRole(
      "checkbox",
    )[1]!;
    fireEvent.click(selected);
    fireEvent.change(screen.getByRole("textbox", { name: "검색어" }), {
      target: { value: "uncommitted" },
    });
    expect(selected).toBeChecked();
    choose("다운로드 범위", "선택한 항목");
    fireEvent.click(screen.getByRole("button", { name: "다운로드" }));
    expect(onDownload).toHaveBeenCalledExactlyOnceWith({
      scope: "selected",
      ids: ["access-1"],
    });
    rerender(view({ periodType: "accessedAt", page: 2 }));
    expect(
      within(screen.getByRole("table")).getAllByRole("checkbox")[1],
    ).not.toBeChecked();
  });

  it("keeps a download selection alert mounted when search is reset", () => {
    const view = (search: MemberRecordSearch) => (
      <TestLocaleProvider>
        <MemberAccessListScreen
          search={search}
          onSearchChange={vi.fn()}
          onRegister={vi.fn()}
          onDownload={vi.fn()}
        />
      </TestLocaleProvider>
    );
    const { rerender } = render(view({ periodType: "accessedAt" }));
    choose("다운로드 범위", "선택한 항목");
    fireEvent.click(screen.getByRole("button", { name: "다운로드" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    rerender(view({}));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "확인" }),
    );
    expect(
      screen.queryByRole("button", { name: "다운로드" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "등록" })).toBeInTheDocument();
  });

  it("keeps withdrawn row activation separate from checkbox and commits header sorting", () => {
    const onActivate = vi.fn();
    const onSearchChange = vi.fn();
    render(
      <TestLocaleProvider>
        <WithdrawnMemberListScreen
          search={{ periodType: "joinedAt", page: 2 }}
          onSearchChange={onSearchChange}
          onRegister={vi.fn()}
          onActivate={onActivate}
        />
      </TestLocaleProvider>,
    );
    const table = screen.getByRole("table");
    fireEvent.click(within(table).getAllByRole("checkbox")[1]!);
    expect(onActivate).not.toHaveBeenCalled();
    fireEvent.click(within(table).getAllByRole("row")[1]!);
    expect(onActivate).toHaveBeenCalledExactlyOnceWith("withdrawn-1");
    fireEvent.click(within(table).getByRole("button", { name: "이메일" }));
    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith({
      periodType: "joinedAt",
      page: undefined,
      sortType: "email",
      sortDirection: "asc",
    });
  });
});
