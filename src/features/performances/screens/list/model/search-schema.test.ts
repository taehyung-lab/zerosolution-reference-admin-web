import { describe, expect, it } from "vitest";
import { performanceListQuery } from "../../../api/queries";
import {
  performanceSearchSchema,
  performanceSearchContract,
  resolvePerformanceSearch,
} from "./search-schema";

describe("performance search defaults", () => {
  it("keeps entry and reset distinct while resolving the same view defaults", () => {
    const entry = resolvePerformanceSearch({});
    expect(entry).toMatchObject({
      page: 1,
      pageSize: 100,
      sortType: "registeredAt",
      periodType: "performedAt",
      keywords: [],
    });
    expect(entry).not.toHaveProperty("searched");
    expect(entry.sortDirection).toBe("desc");
    expect(entry.startDateTime).toBeUndefined();
    expect(entry.endDateTime).toBeUndefined();
    expect(resolvePerformanceSearch({ searched: false })).toEqual(entry);
    expect(performanceSearchSchema.parse(entry)).toEqual({});
  });
  it("preserves explicit period, keywords, sort direction and paging through resolution", () => {
    const search = performanceSearchSchema.parse({
      periodType: "updatedAt",
      sortType: "title",
      sortDirection: "desc",
      page: 2,
      pageSize: 200,
      keywords: [{ field: "title", value: "Concert" }],
      startDateTime: "2026-09-01T00:00:00Z",
      endDateTime: "2026-09-02T00:00:00Z",
    });
    expect(search.startDateTime).toBe("2026-09-01T00:00:00Z");
    expect(search.endDateTime).toBe("2026-09-02T00:00:00Z");
    expect(resolvePerformanceSearch(search)).toMatchObject(search);
    expect(
      performanceSearchSchema.parse(resolvePerformanceSearch(search)),
    ).toEqual(search);
  });
});

it("keeps entry/reset metadata out of performance cache identity", () => {
  const entry = performanceListQuery("ko", resolvePerformanceSearch({}));
  const reset = performanceListQuery(
    "ko",
    resolvePerformanceSearch({ searched: false }),
  );
  const explicit = performanceListQuery(
    "ko",
    resolvePerformanceSearch({ page: 1, pageSize: 100 }),
  );
  expect(entry.queryKey).toEqual(reset.queryKey);
  expect(entry.queryKey).toEqual(explicit.queryKey);
  expect(JSON.stringify(entry.queryKey)).not.toContain("searched");
  expect(
    performanceListQuery("ko", resolvePerformanceSearch({ page: 2 })).queryKey,
  ).not.toEqual(entry.queryKey);
});

it("preserves every performance field and whole-array recovery", () => {
  const input = {
    searched: false,
    periodType: "updatedAt",
    startDateTime: "2026-09-01T00:00:00Z",
    endDateTime: "2026-09-07T00:00:00Z",
    keywords: [{ field: "title", value: "Concert" }],
    ticketKinds: ["paid"],
    performanceTypes: ["live"],
    sellers: ["seller"],
    venueId: "venue",
    sortType: "title",
    sortDirection: "asc",
    page: 2,
    pageSize: 200,
  };
  expect(performanceSearchSchema.parse(input)).toEqual(input);
  for (const value of [
    performanceSearchContract.schema.shape,
    performanceSearchContract.defaults,
    performanceSearchContract.partition,
  ])
    expect(Object.keys(value).sort()).toEqual(
      Object.keys(input)
        .filter((key) => key !== "searched")
        .sort(),
    );
  expect(
    performanceSearchSchema.parse({
      keywords: [
        { field: "title", value: "Concert" },
        { field: "bad", value: "X" },
      ],
      ticketKinds: ["paid", null],
      venueId: "venue",
    }),
  ).toEqual({ venueId: "venue" });
});

it.each([
  { startDateTime: "2026-09-01T00:00:00Z" },
  { endDateTime: "2026-09-01T00:00:00Z" },
  { startDateTime: "wrong", endDateTime: "2026-09-01T00:00:00Z" },
  {
    startDateTime: "2026-09-02T00:00:00Z",
    endDateTime: "2026-09-01T00:00:00Z",
  },
])(
  "removes an invalid closed performance range without losing venue: %j",
  (range) => {
    expect(
      performanceSearchSchema.parse({ ...range, venueId: "venue" }),
    ).toEqual({ venueId: "venue" });
  },
);
