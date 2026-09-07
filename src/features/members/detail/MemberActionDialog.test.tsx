import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { TestLocaleProvider } from "@/test/locale";
import { MemberActionDialog } from "./MemberActionDialog";

function setup(action: "password" | "reveal" | "withdraw") {
  const onRequest = vi.fn();
  function Host() {
    const [open, setOpen] = useState(true);
    return open ? (
      <MemberActionDialog
        action={action}
        memberId="member-42"
        onClose={() => setOpen(false)}
        onRequest={onRequest}
      />
    ) : (
      <p>closed</p>
    );
  }
  const root = createRootRoute({ component: Outlet });
  const page = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: Host,
  });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <TestLocaleProvider>
      <RouterProvider router={router} />
    </TestLocaleProvider>,
  );
  return { onRequest };
}

describe("member detail action boundaries", () => {
  it("validates password confirmation on blur and submit, then submits only the new password", async () => {
    const { onRequest } = setup("password");
    const password = await screen.findByLabelText("비밀번호", {
      exact: false,
      selector: 'input[name="password"]',
    });
    const confirmation = screen.getByLabelText(/비밀번호 확인/);
    fireEvent.change(password, { target: { value: "Strong42!" } });
    fireEvent.change(confirmation, { target: { value: "Wrong42!" } });
    fireEvent.blur(confirmation);
    expect(
      await screen.findByText("비밀번호와 동일하게 입력해주세요."),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(onRequest).not.toHaveBeenCalled();
    fireEvent.change(confirmation, { target: { value: "Strong42!" } });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(onRequest).toHaveBeenCalledExactlyOnceWith({
        kind: "password",
        memberId: "member-42",
        password: "Strong42!",
      }),
    );
    expect(screen.queryByText("비밀번호가 변경되었습니다.")).toBeNull();
    expect(password).toHaveValue("Strong42!");
  });

  it("checks required operator input and stops privacy at the verification request", async () => {
    const { onRequest } = setup("reveal");
    fireEvent.click(await screen.findByRole("button", { name: "확인" }));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(onRequest).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/운영자 비밀번호/), {
      target: { value: "operator-input" },
    });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(onRequest).toHaveBeenCalledExactlyOnceWith({
        kind: "reveal",
        memberId: "member-42",
        operatorPassword: "operator-input",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "개인정보 전체보기" }),
    ).toBeVisible();
  });

  it("requires a five-character withdrawal reason and never fabricates an authenticated final confirmation", async () => {
    const { onRequest } = setup("withdraw");
    fireEvent.change(await screen.findByLabelText(/탈퇴 사유/), {
      target: { value: "짧음" },
    });
    fireEvent.change(screen.getByLabelText(/운영자 비밀번호/), {
      target: { value: "operator-input" },
    });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "사유를 5자 이상 입력해주세요.",
    );
    expect(onRequest).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/탈퇴 사유/), {
      target: { value: "회원의 요청으로 탈퇴" },
    });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(onRequest).toHaveBeenCalledExactlyOnceWith({
        kind: "verifyWithdrawal",
        memberId: "member-42",
        reason: "회원의 요청으로 탈퇴",
        operatorPassword: "operator-input",
      }),
    );
    expect(screen.queryByText(/복원 할 수 없습니다/)).toBeNull();
  });

  it.each(["cancel", "close", "escape"] as const)(
    "dismisses dirty %s without a cancellation question",
    async (method) => {
      setup("reveal");
      const input = await screen.findByLabelText(/운영자 비밀번호/);
      fireEvent.change(input, { target: { value: "keep-input" } });
      if (method === "cancel")
        fireEvent.click(screen.getByRole("button", { name: "취소" }));
      if (method === "close")
        fireEvent.click(screen.getByRole("button", { name: "닫기" }));
      if (method === "escape")
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "알림" })).toBeNull();
      expect(await screen.findByText("closed")).toBeVisible();
    },
  );
});
