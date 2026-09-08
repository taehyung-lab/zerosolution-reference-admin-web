import { canonicalizeRouteSearch } from "@/shared/lib/search";
import { describe, expect, it } from "vitest";
import {
  managerCanonicalSearchSchema,
  managerSearchSchema,
  resolveManagerSearch,
  toManagerRouteSearch,
} from "./search-schema";

describe("managerSearchSchema", () => {
  it("keeps an initial URL sparse and unresolved", () => {
    expect(managerSearchSchema.parse({})).toEqual({});
    expect(resolveManagerSearch({})).toMatchObject({
      periodType: "CREATED_AT",
      page: 1,
      pageSize: 100,
      sortType: "CREATED_AT",
      sortDirection: "DESC",
    });
  });

  it("keeps only valid UTC ISO date-time values", () => {
    expect(
      managerSearchSchema.parse({
        startDateTime: "not-a-date",
        endDateTime: "2026-08-31T23:59:59.999Z",
      }),
    ).toEqual({ endDateTime: "2026-08-31T23:59:59.999Z" });
  });

  it("removes an inverted committed period as one invalid field pair", () => {
    expect(
      managerCanonicalSearchSchema.parse({
        startDateTime: "2026-09-01T00:00:00.000Z",
        endDateTime: "2026-08-31T23:59:59.999Z",
        periodType: "CREATED_AT",
      }),
    ).toEqual({ searched: true });
  });

  it("preserves an ordered committed period when ISO precision differs", () => {
    expect(
      managerCanonicalSearchSchema.parse({
        startDateTime: "2026-08-31T00:00:00Z",
        endDateTime: "2026-08-31T00:00:00.100Z",
        periodType: "UPDATED_AT",
        page: 2,
      }),
    ).toEqual({
      startDateTime: "2026-08-31T00:00:00Z",
      endDateTime: "2026-08-31T00:00:00.100Z",
      periodType: "UPDATED_AT",
      page: 2,
      searched: true,
    });
  });

  it("keeps individually valid dates available for the route canonical gate", () => {
    expect(
      managerSearchSchema.parse({
        startDateTime: "2026-09-01T00:00:00.000Z",
        endDateTime: "2026-08-31T23:59:59.999Z",
      }),
    ).toEqual({
      startDateTime: "2026-09-01T00:00:00.000Z",
      endDateTime: "2026-08-31T23:59:59.999Z",
    });
  });

  it("preserves every typed keyword in the committed URL state", () => {
    const keywords = [
      { keywordType: "ID" as const, keyword: "manager-1" },
      { keywordType: "PHONE" as const, keyword: "010" },
    ];

    expect(managerSearchSchema.parse({ keywords }).keywords).toEqual(keywords);
  });

  it("removes invalid scalar fields instead of injecting URL defaults", () => {
    expect(
      managerSearchSchema.parse({
        page: "wrong",
        pageSize: 0,
        sortType: "UNKNOWN",
      }),
    ).toEqual({});
  });

  it("preserves valid array elements while removing invalid elements", () => {
    expect(managerSearchSchema.parse({ types: ["AGENCY", "BOGUS"] })).toEqual({
      types: ["AGENCY"],
    });
  });

  it("removes client enum vocabulary from the URL", () => {
    expect(managerSearchSchema.parse({ sortType: "createdAt" })).toEqual({});
  });

  it("records only the searched discriminator when every view value is default", () => {
    const resolved = resolveManagerSearch({});

    expect(toManagerRouteSearch(resolved)).toEqual({
      searched: true,
    });
    expect(toManagerRouteSearch({ ...resolved, page: 2 })).toMatchObject({
      page: 2,
    });
  });

  it("fills the searched discriminator for a hand-edited filter and is idempotent", () => {
    const rawSearch = { statuses: ["ACTIVE"] };
    const canonical = canonicalizeRouteSearch(
      managerCanonicalSearchSchema,
      rawSearch,
    );

    expect(canonical).toEqual({
      search: { searched: true, statuses: ["ACTIVE"] },
      changed: true,
    });
    expect(
      canonicalizeRouteSearch(managerCanonicalSearchSchema, canonical.search),
    ).toEqual({
      search: canonical.search,
      changed: false,
    });
  });

  it.each([
    [
      "arbitrary raw search",
      { page: "7", sortDirection: "ASC", unknown: "drop" },
      true,
    ],
    ["string page", { page: "2" }, true],
    ["explicit default page size", { pageSize: "100" }, true],
    [
      "array and object-array fields",
      {
        types: ["AGENCY", "VENDOR"],
        statuses: ["ACTIVE", "INACTIVE"],
        keywords: [
          { keywordType: "ID", keyword: "manager-1" },
          { keywordType: "PHONE", keyword: "010" },
        ],
      },
      true,
    ],
    [
      "invalid scalar and array values",
      { page: "wrong", types: ["AGENCY", "BOGUS"] },
      true,
    ],
  ])("canonicalizes %s exactly once", (_case, rawSearch, firstChanged) => {
    const canonical = canonicalizeRouteSearch(
      managerCanonicalSearchSchema,
      rawSearch,
    );

    expect(canonical.changed).toBe(firstChanged);
    expect(
      canonicalizeRouteSearch(managerCanonicalSearchSchema, canonical.search)
        .changed,
    ).toBe(false);
  });
});

describe("managerSearchSchema sort vocabulary", () => {
  it("drops the rehearsal AGENCY sort key that Managers does not expose", () => {
    expect(managerSearchSchema.parse({ sortType: "AGENCY" })).toEqual({});
    expect(
      managerCanonicalSearchSchema.parse({
        periodType: "CREATED_AT",
        sortType: "AGENCY",
      }),
    ).toEqual({ searched: true });
  });

  it("keeps every exposed sort key", () => {
    expect(managerSearchSchema.parse({ sortType: "ID" })).toEqual({
      sortType: "ID",
    });
  });
});
