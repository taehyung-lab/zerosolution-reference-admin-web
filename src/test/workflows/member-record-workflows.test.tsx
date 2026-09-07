import { TestQueryLocaleProvider as TestLocaleProvider } from "@/test/query-locale";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  appealDetailFixture,
  counselDetailFixture,
} from "../../features/members/fixtures/member-records";
import {
  accessSearchSchema,
  counselSearchSchema,
  dormantSearchSchema,
  withdrawnSearchSchema,
} from "../../features/members/mechanics/record-list/model/member-record-search";
import { MemberDownloadAction } from "../../features/members/mechanics/record-list/ui/MemberDownloadAction";
import { MemberAccessListScreen } from "../../features/members/screens/access/ui/MemberAccessListScreen";
import { AppealBulkAction } from "../../features/members/screens/appeals/ui/AppealBulkAction";
import { AppealDetailScreen } from "../../features/members/screens/appeals/ui/AppealDetailScreen";
import { MemberAppealListScreen } from "../../features/members/screens/appeals/ui/MemberAppealListScreen";
import { DormantMemberListScreen } from "../../features/members/screens/dormant/ui/DormantMemberListScreen";
import { WithdrawnMemberListScreen } from "../../features/members/screens/withdrawn/ui/WithdrawnMemberListScreen";
import { CounselDetailDialog } from "../../features/members/screens/counsel/ui/CounselDetailDialog";
import { MemberCounselListScreen } from "../../features/members/screens/counsel/ui/MemberCounselListScreen";
import { ReissueDialog } from "../../features/members/screens/counsel/ui/ReissueDialog";

vi.mock("@tanstack/react-router", () => ({
  useBlocker: () => ({ status: "idle" }),
}));
function choose(label: string, option: string) {
  fireEvent.keyDown(screen.getByRole("combobox", { name: label }), {
    key: "ArrowDown",
  });
  fireEvent.click(screen.getByRole("option", { name: option }));
}
describe("secondary member pre-request workflows", () => {
  it("clears only the inquiry category back to all before committing search", () => {
    const onSearchChange = vi.fn();
    render(
      <TestLocaleProvider>
        <MemberCounselListScreen
          search={{
            periodType: "receivedAt",
            inquiryType: "booking",
            statuses: ["reviewing"],
          }}
          onSearchChange={onSearchChange}
          onActivate={vi.fn()}
          onDownload={vi.fn()}
          inquiryOptions={[{ value: "booking", label: "예매" }]}
        />
      </TestLocaleProvider>,
    );
    choose("문의유형", "전체");
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onSearchChange).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ["reviewing"] }),
    );
    expect(onSearchChange.mock.calls[0]![0]).not.toHaveProperty("inquiryType");
  });
  it("submits an edited counsel directly with both target IDs and keeps the draft", async () => {
    const detail = counselDetailFixture("counsel-1")!;
    const onUpdate = vi.fn();
    render(
      <TestLocaleProvider>
        <CounselDetailDialog
          detail={detail}
          operatorName="Operator"
          openedAt="2026-09-01T00:00:00Z"
          onClose={vi.fn()}
          onCreate={vi.fn()}
          onUpdate={onUpdate}
          onDelete={vi.fn()}
          onReissue={vi.fn()}
        />
      </TestLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    const edit = screen.getByRole("form", { name: "수정" });
    fireEvent.change(within(edit).getByRole("textbox", { name: /상담내용/ }), {
      target: { value: "수정된 상담" },
    });
    fireEvent.click(within(edit).getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledExactlyOnceWith({
        counselId: detail.id,
        noteId: detail.records[0]!.id,
        input: expect.objectContaining({ content: "수정된 상담" }),
      }),
    );
    expect(
      screen.queryByRole("dialog", { name: "알림" }),
    ).not.toBeInTheDocument();
    expect(within(edit).getByRole("textbox", { name: /상담내용/ })).toHaveValue(
      "수정된 상담",
    );
  });
  it("cancels only the edited counsel and preserves the separate new draft", async () => {
    const detail = counselDetailFixture("counsel-1")!;
    const onClose = vi.fn();
    render(
      <TestLocaleProvider>
        <CounselDetailDialog
          detail={detail}
          operatorName="Operator"
          openedAt="2026-09-01T00:00:00Z"
          onClose={onClose}
          onCreate={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
          onReissue={vi.fn()}
        />
      </TestLocaleProvider>,
    );
    const create = screen.getByRole("form", { name: "신규 상담 등록" });
    fireEvent.change(
      within(create).getByRole("textbox", { name: /상담내용/ }),
      { target: { value: "새 상담 초안" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    const edit = screen.getByRole("form", { name: "수정" });
    fireEvent.change(within(edit).getByRole("textbox", { name: /상담내용/ }), {
      target: { value: "기존 상담 수정 초안" },
    });
    fireEvent.click(within(edit).getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog", { name: "알림" })).toBeNull();
    await waitFor(() =>
      expect(
        screen.queryByRole("form", { name: "수정" }),
      ).not.toBeInTheDocument(),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(
      within(create).getByRole("textbox", { name: /상담내용/ }),
    ).toHaveValue("새 상담 초안");
  });
  it("reuses the member bulk cascade validation and freezes targets on confirm", () => {
    const onChange = vi.fn();
    render(
      <TestLocaleProvider>
        <AppealBulkAction ids={["appeal-1"]} onChange={onChange} />
      </TestLocaleProvider>,
    );
    choose("계정 상태", "불량회원");
    fireEvent.click(screen.getByRole("button", { name: "변경" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "변경할 계정 상태와 활동제한을 선택해주세요.",
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "확인" }),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "스페셜콘텐츠" }));
    fireEvent.click(screen.getByRole("button", { name: "변경" }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "확인" }),
    );
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      ids: ["appeal-1"],
      accountStatus: "flagged",
      restrictions: ["specialContent"],
    });
  });
  it("locks notified appeal controls and retains persisted notification preview", () => {
    const supplied = appealDetailFixture("appeal-1");
    if (!supplied) throw new Error("Missing appeal fixture");
    const onNotify = vi.fn();
    const props = {
      record: supplied,
      memberHref: "/members/example-flagged",
      onSave: vi.fn(),
      onNotify,
      onMessage: vi.fn(),
    };
    const { rerender } = render(
      <TestLocaleProvider>
        <AppealDetailScreen {...props} />
      </TestLocaleProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "회원에게 결과 통보하기" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "회원에게 결과 통보하기",
    });
    expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "보내기" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "알림" })).getByRole("button", {
        name: "확인",
      }),
    );
    expect(onNotify).toHaveBeenCalledExactlyOnceWith({
      appealId: supplied.id,
      processing: supplied.processing,
    });
    rerender(
      <TestLocaleProvider>
        <AppealDetailScreen
          {...props}
          record={{ ...supplied, notified: true }}
        />
      </TestLocaleProvider>,
    );
    expect(
      screen.queryByRole("button", { name: "저장" }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByRole("combobox", { hidden: true })).toHaveLength(0);
    expect(screen.queryAllByRole("textbox", { hidden: true })).toHaveLength(0);
  });
  it("opens the counsel reissue boundary and closes a dirty note without a question", () => {
    const detail = counselDetailFixture("counsel-1");
    if (!detail) throw new Error("Missing counsel fixture");
    const onClose = vi.fn();
    const onReissue = vi.fn();
    render(
      <TestLocaleProvider>
        <CounselDetailDialog
          detail={detail}
          operatorName="Reference operator"
          openedAt="2026-09-01T00:00:00Z"
          onClose={onClose}
          onCreate={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
          onReissue={onReissue}
        />
      </TestLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "티켓재발권" }));
    expect(onReissue).toHaveBeenCalledWith("counsel-note-1");
    const content = screen.getByRole("textbox", { name: /상담내용/ });
    fireEvent.change(content, { target: { value: "Draft note" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "알림" })).toBeNull();
    expect(onClose).toHaveBeenCalledOnce();
  });
  it("renders all five list entry surfaces and commits pending keyword on search", () => {
    const onSearchChange = vi.fn();
    const common = {
      search: {},
      onSearchChange,
      onRegister: vi.fn(),
      onActivate: vi.fn(),
      onMessage: vi.fn(),
      onDownload: vi.fn(),
      onBulkChange: vi.fn(),
    };
    const { rerender } = render(
      <TestLocaleProvider>
        <DormantMemberListScreen {...common} />
      </TestLocaleProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "검색어" }), {
      target: { value: "reference" },
    });
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onSearchChange).toHaveBeenCalledWith(
      expect.objectContaining({
        periodType: "joinedAt",
        keywords: [{ field: "email", value: "reference" }],
      }),
    );
    rerender(
      <TestLocaleProvider>
        <WithdrawnMemberListScreen {...common} />
      </TestLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "등록" })).toBeInTheDocument();
    rerender(
      <TestLocaleProvider>
        <MemberAccessListScreen {...common} />
      </TestLocaleProvider>,
    );
    expect(
      screen.queryByRole("button", { name: "다운로드" }),
    ).not.toBeInTheDocument();
    rerender(
      <TestLocaleProvider>
        <MemberCounselListScreen {...common} inquiryOptions={[]} />
      </TestLocaleProvider>,
    );
    expect(
      screen.getByRole("button", { name: "다운로드" }),
    ).toBeInTheDocument();
    rerender(
      <TestLocaleProvider>
        <MemberAppealListScreen {...common} />
      </TestLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "SMS" })).toBeInTheDocument();
  });
  it("canonicalizes each screen independently without inventing initial searches", () => {
    expect(dormantSearchSchema.parse({})).toEqual({});
    expect(
      withdrawnSearchSchema.parse({
        keywords: [{ field: "phone", value: "123" }],
        sortType: "lastAccessedAt",
      }),
    ).toEqual({ sortType: "lastAccessedAt", periodType: "withdrawnAt" });
    expect(
      accessSearchSchema.parse({
        signupMethods: ["direct"],
        sortType: "grade",
        accountStatuses: ["general", "invalid"],
      }),
    ).toEqual({
      sortType: "grade",
      accountStatuses: ["general"],
      periodType: "accessedAt",
    });
    expect(
      counselSearchSchema.parse({
        statuses: ["held", "reviewing"],
        sortType: "content",
      }),
    ).toEqual({
      statuses: ["reviewing"],
      sortType: "content",
      periodType: "receivedAt",
    });
  });
  it("download validates selected rows and sends only committed filters for all results", () => {
    const onDownload = vi.fn();
    render(
      <TestLocaleProvider>
        <MemberDownloadAction
          ids={[]}
          search={{
            periodType: "accessedAt",
            page: 3,
            pageSize: 100,
            keywords: [{ field: "email", value: "reference" }],
          }}
          onDownload={onDownload}
        />
      </TestLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "다운로드" })).toBeDisabled();
    choose("다운로드 범위", "선택한 항목");
    fireEvent.click(screen.getByRole("button", { name: "다운로드" }));
    expect(onDownload).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "확인" }),
    );
    choose("다운로드 범위", "검색결과 전체");
    fireEvent.click(screen.getByRole("button", { name: "다운로드" }));
    expect(onDownload).toHaveBeenCalledExactlyOnceWith({
      scope: "all",
      search: {
        periodType: "accessedAt",
        keywords: [{ field: "email", value: "reference" }],
      },
    });
  });
  it("rechecks printer busy facts after selection and separates test from normal request", () => {
    const onRequest = vi.fn();
    const printer = {
      id: "fixture",
      name: "Fixture printer",
      enabled: true,
      busy: false,
    };
    const view = (busy: boolean) => (
      <TestLocaleProvider>
        <ReissueDialog
          printers={[{ ...printer, busy }]}
          preview={<p>Reference preview</p>}
          isPending={false}
          isError={false}
          onRetry={vi.fn()}
          onClose={vi.fn()}
          onRequest={onRequest}
        />
      </TestLocaleProvider>
    );
    const { rerender } = render(view(false));
    expect(
      screen.getByRole("button", { name: "발권 시작하기" }),
    ).toBeDisabled();
    choose("스마트프린터 선택", "Fixture printer");
    fireEvent.click(screen.getByRole("button", { name: "테스트 발권" }));
    expect(onRequest).toHaveBeenCalledExactlyOnceWith({
      printerId: "fixture",
      test: true,
    });
    rerender(view(true));
    fireEvent.click(screen.getByRole("button", { name: "발권 시작하기" }));
    expect(screen.getByRole("dialog", { name: "알림" })).toBeInTheDocument();
    expect(onRequest).toHaveBeenCalledTimes(1);
  });
  it("does not promote an unsaved appeal result into the notification baseline", async () => {
    const supplied = appealDetailFixture("appeal-1");
    if (!supplied) throw new Error("Missing explicit appeal fixture");
    const onSave = vi.fn();
    const record = {
      ...supplied,
      processing: { ...supplied.processing, result: "waiting" as const },
    };
    render(
      <TestLocaleProvider>
        <AppealDetailScreen
          record={record}
          memberHref="/members/example-flagged"
          onSave={onSave}
          onNotify={vi.fn()}
          onMessage={vi.fn()}
        />
      </TestLocaleProvider>,
    );
    expect(
      screen.getByRole("button", { name: "회원에게 결과 통보하기" }),
    ).toBeDisabled();
    choose("소명결과", "완료");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        appealId: record.id,
        input: { ...record.processing, result: "completed" },
      }),
    );
    expect(
      screen.getByRole("button", { name: "회원에게 결과 통보하기" }),
    ).toBeDisabled();
  });
});
