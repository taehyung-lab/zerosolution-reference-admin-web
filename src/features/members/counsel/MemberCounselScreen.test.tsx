import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TestQueryLocaleProvider as TestLocaleProvider } from "@/test/query-locale";
import {
  MemberCounselScreen,
  type MemberCounselRequest,
} from "./MemberCounselScreen";

vi.mock("@tanstack/react-router", () => ({
  useBlocker: () => ({ status: "idle" }),
}));

it("binds counsel and note identities to both printer request types without writing data", async () => {
  const onRequest = vi.fn<(request: MemberCounselRequest) => void>();
  render(
    <TestLocaleProvider>
      <MemberCounselScreen
        search={{}}
        onSearchChange={vi.fn()}
        onRequest={onRequest}
      />
    </TestLocaleProvider>,
  );
  fireEvent.click(await screen.findByText("시나리오 검증용 문의 내용"));
  fireEvent.click(await screen.findByRole("button", { name: "티켓재발권" }));
  const dialog = screen.getByRole("dialog", { name: "티켓재발권" });
  fireEvent.keyDown(
    within(dialog).getByRole("combobox", { name: "스마트프린터 선택" }),
    { key: "ArrowDown" },
  );
  fireEvent.click(screen.getByRole("option", { name: "참고 프린터" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "테스트 발권" }));
  fireEvent.click(
    within(dialog).getByRole("button", { name: "발권 시작하기" }),
  );
  expect(onRequest.mock.calls.map(([request]) => request)).toEqual([
    {
      type: "reissue",
      counselId: "counsel-1",
      noteId: "counsel-note-1",
      printerId: "reference-printer",
      test: true,
    },
    {
      type: "reissue",
      counselId: "counsel-1",
      noteId: "counsel-note-1",
      printerId: "reference-printer",
      test: false,
    },
  ]);
  expect(dialog).toBeInTheDocument();
});
