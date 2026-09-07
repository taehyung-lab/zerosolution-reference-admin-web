import { TestQueryLocaleProvider as TestLocaleProvider } from "@/test/query-locale";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import { MemberAppealListScreen } from "./MemberAppealListScreen";

it("keeps selection during filter drafts, clears it on committed search, and keeps the action alert mounted through empty results", async () => {
  const onMessage = vi.fn();
  const view = (search: MemberRecordSearch) => (
    <TestLocaleProvider>
      <MemberAppealListScreen
        search={search}
        onSearchChange={vi.fn()}
        onActivate={vi.fn()}
        onMessage={onMessage}
        onBulkChange={vi.fn()}
      />
    </TestLocaleProvider>
  );
  const { rerender } = render(view({}));
  fireEvent.click(
    await screen.findByRole("checkbox", { name: "현재 페이지 전체 선택" }),
  );
  fireEvent.change(screen.getByRole("textbox", { name: "검색어" }), {
    target: { value: "uncommitted" },
  });
  fireEvent.click(screen.getByRole("button", { name: "SMS" }));
  expect(onMessage).toHaveBeenCalledExactlyOnceWith("sms", ["appeal-1"]);
  rerender(view({ sortType: "flaggedAt" }));
  fireEvent.click(screen.getByRole("button", { name: "이메일" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  rerender(view({ keywords: [{ field: "email", value: "does-not-exist" }] }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "확인" }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("table")).not.toBeInTheDocument(),
  );
  expect(onMessage).toHaveBeenCalledTimes(1);
});
