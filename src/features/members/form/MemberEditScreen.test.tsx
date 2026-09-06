import {
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
import { MemberEditScreen } from "./MemberEditScreen";

function setup(accountStatus: "general" | "flagged" = "flagged") {
  const onConfirm = vi.fn();
  const root = createRootRoute({ component: Outlet });
  const editor = createRoute({
    getParentRoute: () => root,
    path: "/edit",
    component: () => (
      <MemberEditScreen
        memberId="member-1"
        email="member@example.com"
        initialValues={{
          name: "김회원",
          birthDate: "2000-01-01",
          phone: "010-1234-5678",
          accountStatus,
          restrictions: ["inquiry"],
        }}
        onConfirm={onConfirm}
        onCancel={() => router.history.push("/done")}
      />
    ),
  });
  const done = createRoute({
    getParentRoute: () => root,
    path: "/done",
    component: () => <h1>done</h1>,
  });
  const router = createRouter({
    routeTree: root.addChildren([editor, done]),
    history: createMemoryHistory({ initialEntries: ["/edit"] }),
  });
  render(
    <TestLocaleProvider>
      <RouterProvider router={router} />
    </TestLocaleProvider>,
  );
  return { onConfirm, router };
}

async function status(name: string) {
  fireEvent.click(await screen.findByRole("combobox", { name: "계정 상태" }));
  fireEvent.click(await screen.findByRole("option", { name }));
}

describe("member edit Activity boundary", () => {
  it("restores the same check after hiding and submits the current account policy", async () => {
    const { onConfirm } = setup();
    expect(
      await screen.findByRole("checkbox", { name: "1:1문의" }),
    ).toBeChecked();
    await status("일반회원");
    expect(screen.queryByRole("checkbox", { name: "1:1문의" })).toBeNull();
    await status("불량회원");
    expect(
      await screen.findByRole("checkbox", { name: "1:1문의" }),
    ).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "확인",
      }),
    );
    expect(onConfirm).toHaveBeenLastCalledWith({
      memberId: "member-1",
      input: {
        name: "김회원",
        birthDate: "2000-01-01",
        phone: "010-1234-5678",
        accountStatus: "flagged",
        restrictions: ["inquiry"],
      },
    });
    await status("일반회원");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "확인",
      }),
    );
    expect(onConfirm).toHaveBeenLastCalledWith({
      memberId: "member-1",
      input: {
        name: "김회원",
        birthDate: "2000-01-01",
        phone: "010-1234-5678",
        accountStatus: "general",
        restrictions: [],
      },
    });
    await status("불량회원");
    expect(
      await screen.findByRole("checkbox", { name: "1:1문의" }),
    ).toBeChecked();
  });

  it("clears a restriction error when hidden and checks it again when restored", async () => {
    const { onConfirm } = setup();
    fireEvent.click(await screen.findByRole("checkbox", { name: "1:1문의" }));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(onConfirm).not.toHaveBeenCalled();
    await status("일반회원");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    const confirm = await screen.findByRole("dialog");
    fireEvent.click(within(confirm).getByRole("button", { name: "취소" }));
    await status("불량회원");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("initially hidden fields can be shown and edited", async () => {
    setup("general");
    await status("불량회원");
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "스페셜콘텐츠" }),
    );
    await status("일반회원");
    await status("불량회원");
    expect(
      await screen.findByRole("checkbox", { name: "스페셜콘텐츠" }),
    ).toBeChecked();
  });

  it("keeps edited input when leaving is cancelled", async () => {
    const { router } = setup();
    fireEvent.change(await screen.findByRole("textbox", { name: "이름" }), {
      target: { value: "수정회원" },
    });
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "취소",
      }),
    );
    expect(await screen.findByRole("textbox", { name: "이름" })).toHaveValue(
      "수정회원",
    );
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "확인",
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe("/done"));
  });
});
