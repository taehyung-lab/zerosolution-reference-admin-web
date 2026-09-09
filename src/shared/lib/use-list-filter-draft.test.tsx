import { act, renderHook } from "@testing-library/react";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { FilterFieldKeys } from "./search-partition";
import { useListFilterDraft } from "./use-list-filter-draft";

const partition = {
  category: "filter",
  page: "view",
  startDateTime: "filter",
  endDateTime: "filter",
} as const;
const search = {
  category: "all",
  page: 1,
  startDateTime: undefined as string | undefined,
  endDateTime: undefined as string | undefined,
};
function useSubject(value = search, scope: boolean | undefined = true) {
  return useListFilterDraft({
    search: value,
    partition,
    scope,
    keywords: [],
    initialKeywordField: "title",
    localDefaults: { venueKeyword: "" },
  });
}

describe("list filter draft lifecycle", () => {
  it("preserves all drafts on view changes but rebuilds them on the caller scope transition", () => {
    const { result, rerender } = renderHook(
      ({ page, scope }) => useSubject({ ...search, page }, scope),
      { initialProps: { page: 1, scope: true } },
    );
    act(() => {
      result.current.patchDraft({ category: "concert", venueKeyword: "Hall" });
      result.current.keyword.setPendingValue(" pending ");
      result.current.period.setRange({ from: "2026-09-01" });
    });
    rerender({ page: 2, scope: true });
    expect(result.current.draft).toMatchObject({
      category: "concert",
      venueKeyword: "Hall",
    });
    expect(result.current.draft).not.toHaveProperty("page");
    expect(result.current.keyword.pending.value).toBe(" pending ");
    expect(result.current.period.range.from).toBe("2026-09-01");
    rerender({ page: 2, scope: false });
    expect(result.current.draft).toMatchObject({
      category: "all",
      venueKeyword: "",
    });
    expect(result.current.keyword.pending.value).toBe("");
    expect(result.current.period.range.from).toBeUndefined();
  });

  it("captures pending input before resetting the period, without clearing the other drafts", () => {
    const { result } = renderHook(() => useSubject());
    act(() => {
      result.current.patchDraft({ category: "concert" });
      result.current.keyword.setPendingValue(" pending ");
      result.current.period.setRange({ from: "2026-09-01" });
    });
    let input: ReturnType<typeof result.current.prepareSubmit> | undefined;
    act(() => {
      input = result.current.prepareSubmit();
    });
    expect(input?.filters.category).toBe("concert");
    expect(input?.filters).not.toHaveProperty("venueKeyword");
    expect(input?.keywords).toEqual([{ field: "title", value: "pending" }]);
    expect(input?.range.startDateTime).toBeDefined();
    expect(input?.range.endDateTime).toBeUndefined();
    expect(result.current.period.range.from).toBeUndefined();
    expect(result.current.keyword.pending.value).toBe(" pending ");
    expect(result.current.draft.category).toBe("concert");
  });

  it("rebuilds when a selected field set changes without copying unselected fields", () => {
    const { result, rerender } = renderHook(
      ({ variant }: { variant: boolean }) =>
        useListFilterDraft({
          search: { ...search, status: "active" },
          partition: variant
            ? ({ category: "filter", page: "view" } as const)
            : ({ status: "filter", page: "view" } as const),
          keywords: [],
          initialKeywordField: "title",
        }),
      { initialProps: { variant: true } },
    );
    expectTypeOf(result.current.draft.category).toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf(result.current.draft.status).toEqualTypeOf<
      string | undefined
    >();
    act(() => result.current.patchDraft({ category: "draft" }));
    rerender({ variant: false });
    expect(result.current.draft).toEqual({ status: "active" });
  });

  it("keeps view fields out of draft patches and retains union partition field types", () => {
    expectTypeOf<
      FilterFieldKeys<
        | { category: "filter"; page: "view" }
        | { status: "filter"; page: "view" }
      >
    >().toEqualTypeOf<"category" | "status">();
    const { result } = renderHook(() => useSubject());
    expectTypeOf<
      Parameters<typeof result.current.patchDraft>[0]
    >().not.toHaveProperty("page");
    expectTypeOf(result.current.draft.venueKeyword).toEqualTypeOf<string>();
  });

  it("discards every draft even when committed identity does not change, repeatedly", () => {
    const { result } = renderHook(() => useSubject());
    for (const value of ["first", "second"]) {
      act(() => {
        result.current.patchDraft({ category: value, venueKeyword: value });
        result.current.keyword.setPendingValue(value);
        result.current.period.setRange({ from: "2026-09-01" });
      });
      act(() => result.current.resetDrafts());
      expect(result.current.draft).toMatchObject({
        category: "all",
        venueKeyword: "",
      });
      expect(result.current.keyword.pending.value).toBe("");
      expect(result.current.period.range.from).toBeUndefined();
    }
  });
});
