import {
  accessSearchContract,
  accessSearchSchema,
  resolveMemberRecordSearch,
} from "./member-record-search";
import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import { useMemberRecordFilter } from "./useMemberRecordFilter";

describe("member record filter identity", () => {
  it("discards pending keyword and period when history returns from default search to idle", () => {
    const { result, rerender } = renderHook(
      ({ searched }) =>
        useMemberRecordFilter(
          resolveMemberRecordSearch({}, accessSearchContract),
          vi.fn(),
          accessSearchContract,
          searched,
        ),
      { initialProps: { searched: true } },
    );
    act(() => {
      result.current.keyword.setPendingValue("pending");
      result.current.period.setRange({ from: "2026-09-01", to: "2026-09-02" });
      result.current.patchDraft({ accountStatuses: ["flagged"] });
    });
    expect(result.current.keyword.pending.value).toBe("pending");
    expect(result.current.period.utcRange.startDateTime).toBeDefined();
    rerender({ searched: false });
    expect(result.current.keyword.pending.value).toBe("");
    expect(result.current.period.utcRange).toEqual({
      startDateTime: undefined,
      endDateTime: undefined,
    });
    expect(result.current.draft.accountStatuses).toEqual([]);
  });

  it("preserves a draft across equivalent URL key order and view changes", () => {
    const onChange = vi.fn();
    const initial: MemberRecordSearch = {
      periodType: "accessedAt",
      accountStatuses: ["general"],
      page: 2,
    };
    const { result, rerender } = renderHook(
      ({ search }) =>
        useMemberRecordFilter(
          resolveMemberRecordSearch(search, accessSearchContract),
          (next) => {
            onChange(accessSearchSchema.parse(next));
          },
          accessSearchContract,
          true,
        ),
      {
        initialProps: { search: initial },
      },
    );
    act(() => result.current.patchDraft({ accountStatuses: ["flagged"] }));
    rerender({
      search: {
        accountStatuses: ["general"],
        periodType: "accessedAt",
        page: 3,
        sortType: "email",
      },
    });
    expect(result.current.draft.accountStatuses).toEqual(["flagged"]);
    act(() =>
      result.current.submit({
        preventDefault: vi.fn(),
      } as unknown as SubmitEvent<HTMLFormElement>),
    );
    expect(onChange).toHaveBeenCalledWith({
      accountStatuses: ["flagged"],
      sortType: "email",
      searched: true,
    });
  });
});
