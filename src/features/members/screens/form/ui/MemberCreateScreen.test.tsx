import { formatDate } from "@/shared/lib/datetime";
import { TestLocaleProvider } from "@/test/locale";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemberCreateScreen } from "./MemberCreateScreen";

const navigate = vi.fn();
let isGuardDisabled = true;
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useBlocker: (options: { disabled: boolean }) => {
    isGuardDisabled = options.disabled;
    return { status: "idle" };
  },
}));

afterEach(() => navigate.mockClear());

function setup() {
  const onConfirm = vi.fn();
  render(
    <TestLocaleProvider>
      <MemberCreateScreen onConfirm={onConfirm} />
    </TestLocaleProvider>,
  );
  return onConfirm;
}

function fill() {
  fireEvent.change(screen.getByLabelText("이메일*"), {
    target: { value: "member@example.com" },
  });
  fireEvent.change(screen.getByLabelText("비밀번호*"), {
    target: { value: "Safe!729" },
  });
  fireEvent.change(screen.getByLabelText("이름*"), {
    target: { value: "김회원" },
  });
  fireEvent.change(screen.getByLabelText("휴대폰번호*"), {
    target: { value: "010-1234-5678" },
  });
  const calendar = screen.getByRole("group", { name: "생년월일" });
  const today = calendar.querySelector<HTMLButtonElement>(
    "[data-today] button",
  );
  if (today === null) throw new Error("Today must be selectable");
  fireEvent.click(today);
}

describe("member create before API", () => {
  it("marks empty fields, focuses the first and keeps validation after blur", async () => {
    const onConfirm = setup();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(screen.getByLabelText("이메일*")).toHaveFocus());
    expect(screen.getAllByRole("alert")).toHaveLength(5);
    fireEvent.blur(screen.getByLabelText("이메일*"));
    expect(screen.getByLabelText("이메일*")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("retains values on confirmation cancel and sends the validated values only on confirm", async () => {
    const onConfirm = setup();
    fill();
    expect(isGuardDisabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    let dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("저장하시겠습니까?")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByLabelText("이메일*")).toHaveValue("member@example.com");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "확인" }));
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
      email: "member@example.com",
      password: "Safe!729",
      name: "김회원",
      phone: "010-1234-5678",
      birthDate: formatDate(new Date().toISOString()),
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("저장되었습니다.")).not.toBeInTheDocument();
    expect(isGuardDisabled).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("allows clean cancellation toward the existing member list", () => {
    setup();
    expect(isGuardDisabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/members/active/all" });
  });

  it("does not guard values restored to their defaults", () => {
    setup();
    const email = screen.getByLabelText("이메일*");
    fireEvent.change(email, { target: { value: "a" } });
    expect(isGuardDisabled).toBe(false);
    fireEvent.change(email, { target: { value: "" } });
    expect(isGuardDisabled).toBe(true);
  });

  it("focuses a recovery control when the invalid calendar shows only future dates", async () => {
    setup();
    fill();
    const calendar = screen.getByRole("group", { name: "생년월일" });
    const today = calendar.querySelector<HTMLButtonElement>(
      "[data-today] button",
    );
    if (today === null) throw new Error("Today must be selectable");
    fireEvent.click(today);
    fireEvent.click(within(calendar).getByRole("button", { name: "다음 달" }));
    screen.getByRole("button", { name: "저장" }).focus();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(
        within(calendar).getByRole("button", { name: "이전 달" }),
      ).toHaveFocus(),
    );
  });

  it("focuses a calendar day when birth date is the first invalid field", async () => {
    setup();
    fill();
    const calendar = screen.getByRole("group", { name: "생년월일" });
    const today = calendar.querySelector<HTMLButtonElement>(
      "[data-today] button",
    );
    if (today === null) throw new Error("Today must be selectable");
    fireEvent.click(today);
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(calendar).toHaveAttribute("aria-invalid", "true"),
    );
    expect(
      within(calendar).getByRole("grid").contains(document.activeElement),
    ).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
