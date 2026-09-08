import { describe, expect, expectTypeOf, it } from "vitest";
import {
  canonicalizeRouteSearch,
  nonEmptyArray,
  normalizeClosedInstantRange,
  omitSearchDefaults,
  resolveSearchDefaults,
  toTotalPages,
} from "./search";

interface SparseSearch {
  readonly required?: string;
  readonly optional?: string;
}

const completeDefaults = {
  required: "default",
  optional: undefined as string | undefined,
};
const sparseSearch: SparseSearch = {};
const resolved = resolveSearchDefaults(sparseSearch, completeDefaults);

expectTypeOf(resolved.required).toEqualTypeOf<string>();
expectTypeOf(resolved.optional).toEqualTypeOf<string | undefined>();

// @ts-expect-error every sparse key must be declared by the defaults object
resolveSearchDefaults(sparseSearch, { required: "default" });

describe("search utilities", () => {
  it("resolves only declared default keys without leaking sparse extras", () => {
    const sparseWithUnknown = {
      required: "applied",
      optional: "kept",
      unknown: "drop",
    };
    expect(
      resolveSearchDefaults<SparseSearch, typeof completeDefaults>(
        sparseWithUnknown,
        completeDefaults,
      ),
    ).toEqual({ required: "applied", optional: "kept" });
  });

  it("canonicalizes parsed search and compares JSON-like values structurally", () => {
    const schema = {
      parse: () => ({ types: ["AGENCY"], page: undefined }),
    };

    expect(
      canonicalizeRouteSearch(schema, { page: undefined, types: ["AGENCY"] }),
    ).toEqual({ search: { types: ["AGENCY"] }, changed: true });
    expect(canonicalizeRouteSearch(schema, { types: ["AGENCY"] })).toEqual({
      search: { types: ["AGENCY"] },
      changed: false,
    });
  });

  it("returns a copy for non-empty arrays and undefined for empty arrays", () => {
    const values = ["AGENCY"] as const;
    expect(nonEmptyArray(values)).toEqual(["AGENCY"]);
    expect(nonEmptyArray([])).toBeUndefined();
  });

  it("derives at least one total page from the feature-selected page size", () => {
    expect(toTotalPages(0, 100)).toBe(1);
    expect(toTotalPages(201, 100)).toBe(3);
  });
});

it("compares instants independently of fractional-second spelling and preserves independent fields", () => {
  const value = {
    startDateTime: "2026-09-01T00:00:00Z",
    endDateTime: "2026-09-01T00:00:00.100Z",
    page: 2,
  };
  expect(normalizeClosedInstantRange(value)).toEqual(value);
  expect(
    normalizeClosedInstantRange({
      ...value,
      startDateTime: "2026-09-02T00:00:00Z",
    }),
  ).toEqual({ startDateTime: undefined, endDateTime: undefined, page: 2 });
});

it.each([
  { startDateTime: "2026-09-01T00:00:00Z" },
  { endDateTime: "2026-09-01T00:00:00Z" },
  { startDateTime: "wrong", endDateTime: "2026-09-01T00:00:00Z" },
  { startDateTime: "2026-09-01T00:00:00Z", endDateTime: "wrong" },
])(
  "clears both bounds of an incomplete or invalid committed range: %j",
  (range) => {
    expect(normalizeClosedInstantRange({ ...range, page: 2 })).toEqual({
      startDateTime: undefined,
      endDateTime: undefined,
      page: 2,
    });
  },
);

it("omits declared defaults without changing input or removing meaningful nondefaults", () => {
  const value = {
    page: 1,
    pageSize: 200,
    keywords: [],
    periodType: "joinedAt",
  };
  expect(
    omitSearchDefaults(value, {
      page: 1,
      pageSize: 100,
      keywords: [],
      periodType: "joinedAt",
    }),
  ).toEqual({ pageSize: 200 });
  expect(value.page).toBe(1);
});
