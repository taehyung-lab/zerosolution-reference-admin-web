import { waitFor, fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TestQueryLocaleProvider as TestLocaleProvider } from "@/test/query-locale";
import { MemberCounselListScreen } from "./MemberCounselListScreen";
import type { MemberRecordSearch } from "../records/member-record-search";


it("passes selected counsel IDs to download and preserves its mode and alert when committed results become empty", async () => {
  const onDownload = vi.fn();
  const view = (search: MemberRecordSearch) => (
    <TestLocaleProvider>
      <MemberCounselListScreen
        search={search}
        onSearchChange={vi.fn()}
        onActivate={vi.fn()}
        onDownload={onDownload}
        inquiryOptions={[]}
      />
    </TestLocaleProvider>
  );
  const { rerender } = render(view({}));
  fireEvent.click(
    await screen.findByRole("checkbox", { name: "현재 페이지 전체 선택" }),
  );
  fireEvent.keyDown(screen.getByRole("combobox", { name: "다운로드 범위" }), {
    key: "ArrowDown",
  });
  fireEvent.click(screen.getByRole("option", { name: "선택한 항목" }));
  fireEvent.click(screen.getByRole("button", { name: "다운로드" }));
  expect(onDownload).toHaveBeenCalledExactlyOnceWith({
    scope: "selected",
    ids: ["counsel-1"],
  });
  rerender(view({ sortType: "answeredAt" }));
  fireEvent.click(screen.getByRole("button", { name: "다운로드" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  rerender(view({ keywords: [{ field: "email", value: "does-not-exist" }] }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "확인" }),
  );
  await waitFor(() => expect(screen.queryByRole("table")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "다운로드" })).toBeEnabled();
  expect(onDownload).toHaveBeenCalledTimes(1);
});
