import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TestLocaleProvider } from "@/test/locale";
import { appealDetailFixture } from "../fixtures/member-records";
import { AppealDetailScreen } from "./AppealDetailScreen";

vi.mock("@tanstack/react-router", () => ({
  useBlocker: () => ({ status: "idle" }),
}));

describe("appeal detail surface ownership", () => {
  it("keeps the processing draft when canceling notification, then scopes discard to the form", async () => {
    const record = appealDetailFixture("appeal-1");
    if (!record) throw new Error("Missing appeal fixture");
    const onNotify = vi.fn();
    const onSave = vi.fn();
    render(
      <TestLocaleProvider>
        <AppealDetailScreen
          record={record}
          memberHref="/members/example-flagged"
          onSave={onSave}
          onNotify={onNotify}
          onMessage={vi.fn()}
        />
      </TestLocaleProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "담당자 의견" }), {
      target: { value: "보존할 처리 초안" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "회원에게 결과 통보하기" }),
    );
    const preview = screen.getByRole("dialog", {
      name: "회원에게 결과 통보하기",
    });
    fireEvent.click(within(preview).getByRole("button", { name: "보내기" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "알림" })).getByRole("button", {
        name: "취소",
      }),
    );
    expect(onNotify).not.toHaveBeenCalled();
    fireEvent.click(
      within(preview).getAllByRole("button", { name: "취소" }).at(-1)!,
    );
    expect(screen.getByRole("textbox", { name: "담당자 의견" })).toHaveValue(
      "보존할 처리 초안",
    );
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "알림" })).getByRole("button", {
        name: "취소",
      }),
    );
    expect(screen.getByRole("textbox", { name: "담당자 의견" })).toHaveValue(
      "보존할 처리 초안",
    );
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "알림" })).getByRole("button", {
        name: "확인",
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "담당자 의견" })).toHaveValue(
        record.processing.opinion,
      ),
    );
    expect(onSave).not.toHaveBeenCalled();
    expect(onNotify).not.toHaveBeenCalled();
  });
});
