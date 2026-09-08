import { TestQueryLocaleProvider as TestLocaleProvider } from "@/test/query-locale";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MemberRecordSearch } from "../../features/members/model/member-record-search";
import {
  accessSearchSchema,
  withdrawnSearchSchema,
} from "../../features/members/mechanics/record-list/model/member-record-search";
import { WithdrawnMemberListScreen } from "../../features/members/screens/withdrawn/ui/WithdrawnMemberListScreen";
import { MemberAccessListScreen } from "../../features/members/screens/access/ui/MemberAccessListScreen";

vi.mock("../../features/members/fixtures/record-pages", () => ({
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
  it("commits a default-only search, restores it, and returns to idle on repeated reset", async () => {
    const onSearchChange = vi.fn();
    const view = (input: unknown) => (
      <TestLocaleProvider>
        <MemberAccessListScreen
          search={accessSearchSchema.parse(input)}
          onSearchChange={onSearchChange}
          onRegister={vi.fn()}
          onDownload={vi.fn()}
        />
      </TestLocaleProvider>
    );
    const { rerender } = render(view({ page: "wrong" }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ searched: true });
    rerender(view(onSearchChange.mock.lastCall![0]));
    await screen.findByRole("table");
    fireEvent.change(screen.getByRole("textbox", { name: "검색어" }), {
      target: { value: "pending before history back" },
    });
    rerender(view({}));
    expect(screen.getByRole("textbox", { name: "검색어" })).toHaveValue("");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    rerender(view({ searched: true }));
    await screen.findByRole("table");
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));
    expect(onSearchChange).toHaveBeenLastCalledWith({});
    rerender(view({}));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));
    expect(onSearchChange).toHaveBeenLastCalledWith({});
    rerender(view({ page: 1, searched: false }));
    await screen.findByRole("table");
  });

  it("preserves selection while editing a draft and clears it after committed view changes", async () => {
    const onDownload = vi.fn();
    const view = (search: MemberRecordSearch) => (
      <TestLocaleProvider>
        <MemberAccessListScreen
          search={accessSearchSchema.parse(search)}
          onSearchChange={vi.fn()}
          onRegister={vi.fn()}
          onDownload={onDownload}
        />
      </TestLocaleProvider>
    );
    const { rerender } = render(view({ periodType: "accessedAt" }));
    await screen.findByRole("table");
    const selected = within(await screen.findByRole("table")).getAllByRole(
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

  it("keeps a download selection alert mounted when search is reset", async () => {
    const view = (search: MemberRecordSearch) => (
      <TestLocaleProvider>
        <MemberAccessListScreen
          search={accessSearchSchema.parse(search)}
          onSearchChange={vi.fn()}
          onRegister={vi.fn()}
          onDownload={vi.fn()}
        />
      </TestLocaleProvider>
    );
    const { rerender } = render(view({ periodType: "accessedAt" }));
    await screen.findByRole("table");
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

  it("keeps withdrawn row activation separate from checkbox and commits header sorting", async () => {
    const onActivate = vi.fn();
    const onSearchChange = vi.fn();
    render(
      <TestLocaleProvider>
        <WithdrawnMemberListScreen
          search={withdrawnSearchSchema.parse({
            periodType: "joinedAt",
            page: 2,
          })}
          onSearchChange={onSearchChange}
          onRegister={vi.fn()}
          onActivate={onActivate}
        />
      </TestLocaleProvider>,
    );
    const table = await screen.findByRole("table");
    fireEvent.click(within(table).getAllByRole("checkbox")[1]!);
    expect(onActivate).not.toHaveBeenCalled();
    fireEvent.click(within(table).getAllByRole("row")[1]!);
    expect(onActivate).toHaveBeenCalledExactlyOnceWith("withdrawn-1");
    fireEvent.click(within(table).getByRole("button", { name: "이메일" }));
    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith({
      searched: true,
      sortType: "email",
      sortDirection: "asc",
    });
  });
});
