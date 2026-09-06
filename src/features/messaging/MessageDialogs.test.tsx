import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TestLocaleProvider } from "@/test/locale";
import { SmsDialog } from "./SmsDialog";
import { EmailDialog } from "./EmailDialog";

vi.mock("@tanstack/react-router", () => ({
  useBlocker: () => ({ status: "idle" }),
}));
const policy = {
  enabled: true,
  channelEnabled: true,
  senderName: "운영팀",
  senderAddress: "0212345678",
};
const recipients = [{ address: "01012345678", name: "김회원" }];

describe("message dialogs before API", () => {
  it.each(["sms", "email"])(
    "closes %s without discard after restoring sender",
    (channel) => {
      const onClose = vi.fn();
      const Component = channel === "sms" ? SmsDialog : EmailDialog;
      render(
        <TestLocaleProvider>
          <Component
            policy={{
              ...policy,
              senderAddress:
                channel === "sms" ? policy.senderAddress : "sender@example.com",
            }}
            recipients={
              channel === "sms"
                ? recipients
                : [{ address: "member@example.com" }]
            }
            onClose={onClose}
            onConfirm={vi.fn()}
          />
        </TestLocaleProvider>,
      );
      const sender = screen.getByLabelText("이름*");
      fireEvent.change(sender, { target: { value: "변경" } });
      fireEvent.change(sender, { target: { value: policy.senderName } });
      fireEvent.click(screen.getByRole("button", { name: "취소" }));
      expect(onClose).toHaveBeenCalledOnce();
      expect(
        screen.queryByRole("dialog", { name: "알림" }),
      ).not.toBeInTheDocument();
    },
  );
  it.each([
    { enabled: false, channelEnabled: true },
    { enabled: true, channelEnabled: false },
  ])("blocks SMS for disabled policy %o", (flags) => {
    const onClose = vi.fn();
    render(
      <TestLocaleProvider>
        <SmsDialog
          policy={{ ...policy, ...flags }}
          recipients={recipients}
          onClose={onClose}
          onConfirm={vi.fn()}
        />
      </TestLocaleProvider>,
    );
    expect(
      screen.queryByRole("button", { name: "보내기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/SMS가 사용설정되어 있지 않습니다/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
  it("rejects empty content then sends edited recipients without their old names", async () => {
    const onConfirm = vi.fn();
    render(
      <TestLocaleProvider>
        <SmsDialog
          policy={policy}
          recipients={recipients}
          onClose={vi.fn()}
          onConfirm={onConfirm}
        />
      </TestLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "보내기" }));
    await screen.findByText("내용을 입력해주세요.");
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("받는 사람 1*"), {
      target: { value: "01098765432" },
    });
    expect(screen.queryByText("김회원")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "받는 사람 추가" }));
    fireEvent.change(screen.getByLabelText("받는 사람 2*"), {
      target: { value: "01022224444" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "광고성 메시지" }));
    fireEvent.change(screen.getByLabelText("메시지 내용*"), {
      target: { value: "새 안내" },
    });
    fireEvent.click(screen.getByRole("button", { name: "보내기" }));
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
        senderName: "운영팀",
        senderAddress: "02-1234-5678",
        recipients: [
          { address: "010-9876-5432" },
          { address: "010-2222-4444" },
        ],
        messageType: "advertisement",
        body: "새 안내",
      }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it.each(["취소", "닫기", "Escape"])(
    "asks before dirty %s, keeps content on keep and closes on discard",
    (label) => {
      const onClose = vi.fn();
      render(
        <TestLocaleProvider>
          <SmsDialog
            policy={policy}
            recipients={recipients}
            onClose={onClose}
            onConfirm={vi.fn()}
          />
        </TestLocaleProvider>,
      );
      fireEvent.change(screen.getByLabelText("메시지 내용*"), {
        target: { value: "작성 중" },
      });
      const dismiss = () => {
        if (label === "Escape") fireEvent.keyDown(document, { key: "Escape" });
        else fireEvent.click(screen.getByRole("button", { name: label }));
      };
      dismiss();
      let prompt = screen.getByRole("dialog", { name: "알림" });
      fireEvent.click(within(prompt).getByRole("button", { name: "취소" }));
      expect(screen.getByLabelText("메시지 내용*")).toHaveValue("작성 중");
      expect(onClose).not.toHaveBeenCalled();
      dismiss();
      prompt = screen.getByRole("dialog", { name: "알림" });
      fireEvent.click(within(prompt).getByRole("button", { name: "확인" }));
      expect(onClose).toHaveBeenCalledOnce();
    },
  );
  it("renders a named HTML editor with formatting controls and rejects empty HTML", async () => {
    const onConfirm = vi.fn();
    render(
      <TestLocaleProvider>
        <EmailDialog
          policy={{ ...policy, senderAddress: "sender@example.com" }}
          recipients={[{ address: "member@example.com", name: "김회원" }]}
          onClose={vi.fn()}
          onConfirm={onConfirm}
        />
      </TestLocaleProvider>,
    );
    expect(
      screen.getByRole("textbox", { name: "메시지 내용" }),
    ).toHaveAttribute("contenteditable", "true");
    expect(screen.getByRole("button", { name: "굵게" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기울임" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "목록" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "보내기" }));
    await screen.findByText("내용을 입력해주세요.");
    expect(onConfirm).not.toHaveBeenCalled();
    const editor = screen.getByRole("textbox", { name: "메시지 내용" });
    editor.innerHTML = "<p>Hello <strong>member</strong></p>";
    fireEvent.input(editor);
    await waitFor(() =>
      expect(
        screen.queryByText("내용을 입력해주세요."),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "보내기" }));
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
        senderName: "운영팀",
        senderAddress: "sender@example.com",
        recipients: [{ address: "member@example.com", name: "김회원" }],
        messageType: "information",
        body: "<p>Hello <strong>member</strong></p>",
      }),
    );
  });
});
