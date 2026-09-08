import { ApiError } from "@/api/error";
import { TestQueryLocaleProvider as TestLocaleProvider } from "@/test/query-locale";
import { chooseOptionIn } from "@/test/select";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  readManagerDirectoryPermissionOptions,
  readManagerDirectoryTypeOptions,
} from "../../../fixtures/directory-options";
import { type ManagerListSearch } from "../../../model/manager-list-search";
import { managerListSearchSchema } from "../model/manager-list-search";
import type { ManagerListActionRequest } from "../model/useManagerListActions";
import { ManagerListScreen } from "./ManagerListScreen";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  Link: ({ children }: { children: ReactNode }) => (
    <a href="/managers/new">{children}</a>
  ),
}));
/** 옵션 응답만 대체해 지연·실패를 만든다. Query 실행과 화면 조립 경로는 제품과 같다. */
vi.mock(
  import("../../../fixtures/directory-options"),
  async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...actual,
      readManagerDirectoryTypeOptions: vi.fn(
        actual.readManagerDirectoryTypeOptions,
      ),
      readManagerDirectoryPermissionOptions: vi.fn(
        actual.readManagerDirectoryPermissionOptions,
      ),
    };
  },
);

function Harness({
  onCommit,
  onActionRequest,
}: {
  readonly onCommit: (value: ManagerListSearch) => void;
  readonly onActionRequest: (request: ManagerListActionRequest) => void;
}) {
  const [search, setSearch] = useState<ManagerListSearch>({});
  return (
    <ManagerListScreen
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        onCommit(value);
      }}
      onActionRequest={onActionRequest}
    />
  );
}

describe("manager product search input", () => {
  it("allows the used permission of another type and displays per-record email and access date", async () => {
    const onCommit = vi.fn();
    render(
      <TestLocaleProvider>
        <Harness onCommit={onCommit} onActionRequest={vi.fn()} />
      </TestLocaleProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "권한" })).toBeEnabled(),
    );
    await chooseOptionIn("권한", "Example site permission");
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ permission: "2" }),
    );
    await screen.findByText("검색 결과가 없습니다.");
    await chooseOptionIn("권한", "전체");
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(
      await screen.findByText("operator1@example.com"),
    ).toBeInTheDocument();
    expect(screen.getByText("operator2@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("2026-08-03").length).toBeGreaterThan(0);
    expect(screen.queryByText("2026-08-02")).not.toBeInTheDocument();
  });
  it("accepts product states and email keyword without mapping to rehearsal values", () => {
    const search = {
      periodType: "joinedAt",
      statuses: ["rejected", "inactive"],
      keywords: [{ field: "email", value: "test@example.com" }],
      permission: "1",
    };
    expect(managerListSearchSchema.parse(search)).toEqual({ keywords: search.keywords, statuses: search.statuses, permission: search.permission, searched: true });
  });

  it("removes a reversed date pair but preserves independently valid input", () => {
    expect(
      managerListSearchSchema.parse({
        periodType: "joinedAt",
        permission: "1",
        startDateTime: "2026-09-06T00:00:00Z",
        endDateTime: "2026-09-05T00:00:00Z",
      }),
    ).toEqual({ searched: true, permission: "1" });
  });

  it("commits email, permission and status then retains view settings on a later search", async () => {
    const onCommit = vi.fn();
    render(
      <TestLocaleProvider>
        <Harness onCommit={onCommit} onActionRequest={vi.fn()} />
      </TestLocaleProvider>,
    );
    await chooseOptionIn("검색어 구분", "이메일");
    fireEvent.change(screen.getByRole("textbox", { name: "검색어" }), {
      target: { value: "test@example.com" },
    });
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "권한" })).toBeEnabled(),
    );
    await chooseOptionIn("권한", "Example permission");
    fireEvent.click(screen.getByRole("checkbox", { name: "거절" }));
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searched: true,
        permission: "1",
        statuses: ["awaiting", "active", "inactive", "locked"],
        keywords: [{ field: "email", value: "test@example.com" }],
      }),
    );
    await chooseOptionIn("보기", "200");
    await chooseOptionIn("정렬", "이메일");
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageSize: 200, sort: "email" }),
    );
  });

  it("validates selection and confirms only eligible product-state rows", async () => {
    const onActionRequest =
      vi.fn<(request: ManagerListActionRequest) => void>();
    render(
      <TestLocaleProvider>
        <Harness onCommit={vi.fn()} onActionRequest={onActionRequest} />
      </TestLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    fireEvent.click(screen.getByRole("button", { name: "변경" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "변경할 항목을 선택해주세요.",
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "확인" }),
    );
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "현재 페이지 전체 선택" }),
    );
    await chooseOptionIn("변경 항목", "활성");
    fireEvent.click(screen.getByRole("button", { name: "변경" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "확인" }),
    );
    expect(onActionRequest).toHaveBeenCalledExactlyOnceWith({
      type: "bulkChange",
      targetIds: expect.arrayContaining(["example-active"]),
      values: { accountStatus: "active" },
    });
    expect(onActionRequest.mock.calls[0]?.[0].targetIds).toHaveLength(40);
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(
      screen.getByRole("checkbox", { name: "현재 페이지 전체 선택" }),
    ).not.toBeChecked();
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(6));
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("보기 정렬 목록과 정렬 가능한 헤더가 같은 집합이고 활성 컬럼 하나만 aria-sort를 갖는다", async () => {
    render(
      <TestLocaleProvider>
        <Harness onCommit={vi.fn()} onActionRequest={vi.fn()} />
      </TestLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    const table = await screen.findByRole("table");
    const sortableHeaders = () =>
      within(table)
        .getAllByRole("columnheader")
        .filter((header) => within(header).queryAllByRole("button").length > 0);
    const activeHeaders = () =>
      within(table)
        .getAllByRole("columnheader")
        .filter((header) => header.getAttribute("aria-sort") !== null);

    fireEvent.keyDown(screen.getByRole("combobox", { name: "정렬" }), {
      key: "Enter",
    });
    const listbox = await screen.findByRole("listbox");
    const sortOptions = within(listbox)
      .getAllByRole("option")
      .map((option) => option.textContent ?? "");
    fireEvent.keyDown(listbox, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());

    expect(sortableHeaders()).toHaveLength(sortOptions.length);
    for (const name of sortOptions)
      expect(within(table).getByRole("button", { name })).toBeInTheDocument();

    expect(activeHeaders()).toHaveLength(1);
    expect(activeHeaders()[0]).toHaveAttribute("aria-sort", "descending");
    expect(
      within(activeHeaders()[0]!).getByRole("button"),
    ).toHaveAccessibleName("가입일");

    fireEvent.click(within(table).getByRole("button", { name: "이메일" }));
    await waitFor(() =>
      expect(
        within(activeHeaders()[0]!).getByRole("button"),
      ).toHaveAccessibleName("이메일"),
    );
    expect(activeHeaders()).toHaveLength(1);
  });
});

describe("manager product filter option queries", () => {
  it("옵션이 도착하기 전에는 로딩을 보이고 도착하면 옵션을 보인다", async () => {
    render(
      <TestLocaleProvider>
        <Harness onCommit={vi.fn()} onActionRequest={vi.fn()} />
      </TestLocaleProvider>,
    );

    expect(screen.getByRole("status", { name: "권한" })).toHaveTextContent(
      "옵션을 불러오는 중입니다.",
    );
    expect(screen.getByRole("status", { name: "유형" })).toHaveTextContent(
      "옵션을 불러오는 중입니다.",
    );
    expect(screen.queryByRole("combobox", { name: "권한" })).toBeNull();

    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "권한" })).toBeEnabled(),
    );
    expect(
      screen.getByRole("checkbox", { name: "Example type" }),
    ).toBeInTheDocument();
  });

  it("옵션 조회 실패를 빈 선택지로 숨기지 않고 필드별 재시도로 복구한다", async () => {
    const permissions = vi.mocked(readManagerDirectoryPermissionOptions);
    const types = vi.mocked(readManagerDirectoryTypeOptions);
    const originalPermissions = permissions.getMockImplementation()!;
    permissions.mockImplementation(() => {
      throw new ApiError({ kind: "network", message: "test" });
    });
    render(
      <TestLocaleProvider>
        <Harness onCommit={vi.fn()} onActionRequest={vi.fn()} />
      </TestLocaleProvider>,
    );

    expect(
      await screen.findByRole("alert", { name: "권한" }),
    ).toHaveTextContent("옵션을 불러오지 못했습니다.");
    expect(screen.queryByRole("combobox", { name: "권한" })).toBeNull();
    // 실패한 필드만 대체된다. 같은 화면의 유형 옵션은 계속 선택할 수 있다.
    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", { name: "Example type" }),
      ).toBeInTheDocument(),
    );
    expect(types).toHaveBeenCalled();

    permissions.mockImplementation(originalPermissions);
    fireEvent.click(screen.getByRole("button", { name: "권한 다시 시도" }));
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "권한" })).toBeEnabled(),
    );
    await chooseOptionIn("권한", "Example site permission");
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(
      await screen.findByText("검색 결과가 없습니다."),
    ).toBeInTheDocument();
  });
});
