import { MessageFormDialog } from "./MessageFormDialog";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/error";
import { TestLocaleProvider } from "@/test/locale";
import { TestQueryLocaleProvider } from "@/test/query-locale";
import { MessageComposerDialog } from "./MessageComposerDialog";
import { messagePolicyFixture } from "./fixtures/message-policy";

vi.mock("@tanstack/react-router", () => ({
  useBlocker: () => ({ status: "idle" }),
}));
vi.mock(import("./fixtures/message-policy"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    messagePolicyFixture: vi.fn(actual.messagePolicyFixture),
  };
});
const policy = {
  enabled: true,
  channelEnabled: true,
  senderName: "운영팀",
  senderAddress: "0212345678",
};
const recipients = [{ address: "01012345678", name: "김회원" }];

describe("message dialogs before API", () => {
  it.each(["sms", "email"] as const)(
    "closes %s without discard after restoring sender",
    (channel) => {
      const onClose = vi.fn();
      render(
        <TestLocaleProvider>
          <MessageFormDialog
            channel={channel}
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
        <MessageFormDialog
          channel="sms"
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
        <MessageFormDialog
          channel="sms"
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
    "closes dirty %s without an extra cancellation question",
    (label) => {
      const onClose = vi.fn();
      render(
        <TestLocaleProvider>
          <MessageFormDialog
            channel="sms"
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
      expect(screen.queryByRole("dialog", { name: "알림" })).toBeNull();
      expect(onClose).toHaveBeenCalledOnce();
    },
  );
  it("renders a named HTML editor with formatting controls and rejects empty HTML", async () => {
    const onConfirm = vi.fn();
    render(
      <TestLocaleProvider>
        <MessageFormDialog
          channel="email"
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
  it.each(["sms", "email"] as const)(
    "passes the %s channel with validated input through the composed request",
    async (channel) => {
      const onConfirm = vi.fn();
      const address = channel === "sms" ? "01012345678" : "member@example.com";
      render(
        <TestQueryLocaleProvider>
          <MessageComposerDialog
            request={{ channel, recipients: [{ address, name: "김회원" }] }}
            onClose={vi.fn()}
            onConfirm={onConfirm}
          />
        </TestQueryLocaleProvider>,
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        "옵션을 불러오는 중입니다.",
      );
      fireEvent.click(await screen.findByRole("button", { name: "보내기" }));
      await screen.findByText("내용을 입력해주세요.");
      expect(onConfirm).not.toHaveBeenCalled();
      const body = screen.getByRole("textbox", { name: "메시지 내용" });
      if (channel === "sms")
        fireEvent.change(body, { target: { value: "안내 본문" } });
      else {
        body.innerHTML = "<p>안내 본문</p>";
        fireEvent.input(body);
      }
      fireEvent.click(screen.getByRole("button", { name: "보내기" }));
      await waitFor(() =>
        expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
          channel,
          senderName: "REFERENCE",
          senderAddress:
            channel === "sms" ? "02-0000-0000" : "sender@example.test",
          recipients: [
            {
              address: channel === "sms" ? "010-1234-5678" : address,
              name: "김회원",
            },
          ],
          messageType: "information",
          body: channel === "sms" ? "안내 본문" : "<p>안내 본문</p>",
        }),
      );
    },
  );
});

describe("message policy supply", () => {
  it("never opens the composer with an empty sender: it shows the failure with a retry, then the form", async () => {
    const read = vi.mocked(messagePolicyFixture);
    read.mockClear().mockImplementationOnce(() => {
      throw new ApiError({ kind: "network", message: "test" });
    });
    render(
      <TestQueryLocaleProvider>
        <MessageComposerDialog
          request={{ channel: "sms", recipients: [{ address: "01012345678" }] }}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      </TestQueryLocaleProvider>,
    );
    expect(await screen.findByText("옵션을 불러오지 못했습니다.")).toBeVisible();
    expect(screen.queryByLabelText("이름*")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "보내는 사람 다시 시도" }));
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    expect(await screen.findByLabelText("이름*")).toHaveValue("REFERENCE");
    expect(screen.queryByText("옵션을 불러오지 못했습니다.")).toBeNull();
  });
});
