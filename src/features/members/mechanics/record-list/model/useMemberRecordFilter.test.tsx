import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import { useMemberRecordFilter } from "./useMemberRecordFilter";

describe("member record filter identity", () => {
  it("preserves a draft across equivalent URL key order and view changes", () => {
    const onChange = vi.fn();
    const initial: MemberRecordSearch = {
      periodType: "accessedAt",
      accountStatuses: ["general"],
      page: 2,
    };
    const { result, rerender } = renderHook(
      ({ search }) => useMemberRecordFilter(search, onChange, "accessedAt"),
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
      periodType: "accessedAt",
      accountStatuses: ["flagged"],
      sortType: "email",
    });
  });
});
