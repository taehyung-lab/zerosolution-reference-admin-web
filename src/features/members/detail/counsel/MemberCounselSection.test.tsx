import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { TestLocaleProvider } from "@/test/locale";
import { MemberCounselSection } from "./MemberCounselSection";
import type { MemberCounselRecord } from "./member-counsel-schema";

const record: MemberCounselRecord = {
  id: "counsel-1",
  createdAt: "2026-09-01T00:00:00Z",
  receivedAt: "2026-09-01T00:00:00Z",
  answeredAt: "2026-09-01T00:00:00Z",
  operatorName: "기존담당자",
  inquiryType: "booking",
  content: "기존 상담",
};
function setup() {
  const onCreate = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const root = createRootRoute({ component: Outlet });
  const detail = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => (
      <MemberCounselSection
        records={[record]}
        operatorName="로그인담당자"
        openedAt="2026-09-01T12:30:00Z"
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    ),
  });
  const done = createRoute({
    getParentRoute: () => root,
    path: "/done",
    component: () => <h1>done</h1>,
  });
  const router = createRouter({
    routeTree: root.addChildren([detail, done]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <TestLocaleProvider>
      <RouterProvider router={router} />
    </TestLocaleProvider>,
  );
  return { onCreate, onUpdate, onDelete, router };
}

describe("member counsel request boundary", () => {
  it("validates required fields, uses the operator default, and sends input without fake success", async () => {
    const { onCreate } = setup();
    expect(await screen.findByRole("textbox", { name: "담당자" })).toHaveValue(
      "로그인담당자",
    );
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(onCreate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("combobox", { name: "문의유형" }));
    fireEvent.click(await screen.findByRole("option", { name: "예매" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "상담내용 및 처리결과" }),
      { target: { value: "새 상담\n<b>그대로</b>" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        operatorName: "로그인담당자",
        inquiryType: "booking",
        content: "새 상담\n<b>그대로</b>",
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("textbox", { name: "상담내용 및 처리결과" }),
    ).toHaveValue("새 상담\n<b>그대로</b>");
  });

  it("preserves new input while editing a record and guards only the local dirty edit on cancel", async () => {
    const { onUpdate, router } = setup();
    fireEvent.change(
      await screen.findByRole("textbox", { name: "상담내용 및 처리결과" }),
      { target: { value: "새 draft" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    const creation = within(
      screen.getByRole("form", { name: "신규 상담 등록" }),
    );
    expect(
      creation.getByRole("textbox", { name: "상담내용 및 처리결과" }),
    ).toHaveValue("새 draft");
    let editing = within(screen.getByRole("form", { name: "수정" }));
    expect(editing.getByRole("textbox", { name: "담당자" })).toHaveValue(
      "기존담당자",
    );
    fireEvent.click(editing.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    editing = within(screen.getByRole("form", { name: "수정" }));
    expect(editing.getByRole("textbox", { name: "담당자" }).id).not.toBe(
      creation.getByRole("textbox", { name: "담당자" }).id,
    );
    fireEvent.change(
      editing.getByRole("textbox", { name: "상담내용 및 처리결과" }),
      { target: { value: "수정 draft" } },
    );
    await act(async () => {
      router.history.push("/done");
      await Promise.resolve();
    });
    expect(await screen.findAllByRole("dialog")).toHaveLength(1);
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "취소" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(
      creation.getByRole("textbox", { name: "상담내용 및 처리결과" }),
    ).toHaveValue("새 draft");
    expect(
      editing.getByRole("textbox", { name: "상담내용 및 처리결과" }),
    ).toHaveValue("수정 draft");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "취소",
      }),
    );
    expect(
      editing.getByRole("textbox", { name: "상담내용 및 처리결과" }),
    ).toHaveValue("수정 draft");
    fireEvent.click(editing.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith(
        "counsel-1",
        expect.objectContaining({ content: "수정 draft" }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "확인",
      }),
    );
    expect(creation.getByRole("textbox", { name: "담당자" })).toHaveValue(
      "로그인담당자",
    );
    expect(
      creation.getByRole("textbox", { name: "상담내용 및 처리결과" }),
    ).toHaveValue("새 draft");
  });

  it("confirms delete without removing the record and guards route exit", async () => {
    const { onDelete, router } = setup();
    fireEvent.click(await screen.findByRole("button", { name: "삭제" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "취소",
      }),
    );
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "확인",
      }),
    );
    expect(onDelete).toHaveBeenCalledExactlyOnceWith("counsel-1");
    expect(screen.getByText("기존 상담")).toBeVisible();
    fireEvent.change(
      screen.getByRole("textbox", { name: "상담내용 및 처리결과" }),
      { target: { value: "유지할 입력" } },
    );
    await act(async () => {
      router.history.push("/done");
      await Promise.resolve();
    });
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "취소",
      }),
    );
    expect(router.state.location.pathname).toBe("/");
    expect(
      await screen.findByRole("textbox", { name: "상담내용 및 처리결과" }),
    ).toHaveValue("유지할 입력");
  });
});
