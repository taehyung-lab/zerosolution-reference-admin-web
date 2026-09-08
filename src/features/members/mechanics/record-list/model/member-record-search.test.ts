import { describe, expect, expectTypeOf, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  accessDataQuery,
  appealDataQuery,
  counselDataQuery,
  dormantDataQuery,
  withdrawnDataQuery,
} from "../../../api/list-queries";
import {
  accessSearchContract,
  accessSearchSchema,
  appealSearchContract,
  appealSearchSchema,
  counselSearchContract,
  counselSearchSchema,
  dormantSearchContract,
  dormantSearchSchema,
  withdrawnSearchContract,
  withdrawnSearchSchema,
  resolveMemberRecordSearch,
} from "./member-record-search";

const cases = [
  {
    name: "dormant",
    contract: dormantSearchContract,
    schema: dormantSearchSchema,
    query: dormantDataQuery,
    period: "joinedAt",
    sort: "joinedAt",
    extra: ["signupMethods", "accountStatuses"],
  },
  {
    name: "withdrawn",
    contract: withdrawnSearchContract,
    schema: withdrawnSearchSchema,
    query: withdrawnDataQuery,
    period: "joinedAt",
    sort: "withdrawnAt",
    extra: ["signupMethods", "accountStatuses"],
  },
  {
    name: "access",
    contract: accessSearchContract,
    schema: accessSearchSchema,
    query: accessDataQuery,
    period: "accessedAt",
    sort: "accessedAt",
    extra: ["accountStatuses", "accessPaths"],
  },
  {
    name: "counsel",
    contract: counselSearchContract,
    schema: counselSearchSchema,
    query: counselDataQuery,
    period: "receivedAt",
    sort: "receivedAt",
    extra: ["signupMethods", "accountStatuses", "inquiryType", "statuses"],
  },
  {
    name: "appeal",
    contract: appealSearchContract,
    schema: appealSearchSchema,
    query: appealDataQuery,
    period: "appliedAt",
    sort: "appliedAt",
    extra: ["restrictions", "statuses", "results"],
  },
] as const;

for (const entry of cases)
  describe(entry.name + " search contract", () => {
    it("derives exactly its owned fields and keeps an empty URL sparse", () => {
      const expected = [
        "periodType",
        "startDateTime",
        "endDateTime",
        "keywords",
        "sortType",
        "sortDirection",
        "page",
        "pageSize",
        ...entry.extra,
      ].sort();
      for (const values of [
        entry.contract.schema.shape,
        entry.contract.defaults,
        entry.contract.partition,
      ])
        expect(Object.keys(values).sort()).toEqual(expected);
      expect(entry.schema.parse({})).toEqual({});
      expect(resolveMemberRecordSearch({}, entry.contract)).toMatchObject({
        periodType: entry.period,
        sortType: entry.sort,
        sortDirection: "desc",
        page: 1,
        pageSize: 100,
        keywords: [],
      });
    });
    it("uses the same request and cache for explicit and omitted view defaults", async () => {
      const sparse = entry.schema.parse({ periodType: entry.period });
      const explicit = entry.schema.parse({
        ...sparse,
        sortType: entry.sort,
        sortDirection: "desc",
        page: 1,
        pageSize: 100,
      });
      const first = entry.query(
        "ko",
        resolveMemberRecordSearch(sparse, entry.contract),
      );
      const second = entry.query(
        "ko",
        resolveMemberRecordSearch(explicit, entry.contract),
      );
      expect(first.queryKey).toEqual(second.queryKey);
      expect(
        resolveMemberRecordSearch(sparse, entry.contract),
      ).not.toHaveProperty("searched");
      expect(JSON.stringify(first.queryKey)).not.toContain("searched");
      const client = new QueryClient({
        defaultOptions: { queries: { staleTime: Infinity, retry: false } },
      });
      const firstPage = await client.query({
        queryKey: first.queryKey,
        queryFn: async (context): Promise<unknown> => first.queryFn!(context),
      });
      expect(
        await client.query({
          queryKey: second.queryKey,
          queryFn: async (context): Promise<unknown> =>
            second.queryFn!(context),
        }),
      ).toBe(firstPage);
      expect(client.getQueryCache().getAll()).toHaveLength(1);
      expect(
        entry.query(
          "ko",
          resolveMemberRecordSearch({ ...sparse, page: 2 }, entry.contract),
        ).queryKey,
      ).not.toEqual(first.queryKey);
      client.clear();
    });
  });

it("preserves per-screen keyword/status recovery without injecting a period discriminator", () => {
  expect(withdrawnSearchSchema.parse({ page: 2 })).toEqual({
    searched: true,
    page: 2,
  });
  expect(
    withdrawnSearchSchema.parse({
      keywords: [
        { field: "name", value: "A" },
        { field: "email", value: " A " },
      ],
    }),
  ).toEqual({
    searched: true,
    keywords: [{ field: "email", value: "A" }],
  });
  expect(
    counselSearchSchema.parse({
      statuses: ["held", "waiting"],
      results: ["rejected"],
    }),
  ).toEqual({ statuses: ["waiting"] });
  expect(
    appealSearchSchema.parse({
      statuses: ["held", "waiting"],
      results: ["rejected"],
    }),
  ).toEqual({
    statuses: ["held", "waiting"],
    results: ["rejected"],
  });
  expectTypeOf(withdrawnSearchContract.schema.parse({}).keywords).toEqualTypeOf<
    { field: "email"; value: string }[] | undefined
  >();
  expectTypeOf(accessSearchContract.schema.parse({}).periodType).toEqualTypeOf<
    "accessedAt" | undefined
  >();
});

describe.each([dormantSearchSchema, withdrawnSearchSchema, accessSearchSchema])(
  "explicit record search intent",
  (schema) => {
    it("retains default search intent and recovers direct links before omitting defaults", () => {
      expect(schema.parse({ searched: true })).toEqual({ searched: true });
      expect(schema.parse({ searched: false })).toEqual({});
      expect(
        schema.parse({ page: "wrong", periodType: "wrong", other: true }),
      ).toEqual({});
      expect(schema.parse({ page: 1 })).toEqual({ searched: true });
      expect(schema.parse({ page: 2, searched: false })).toEqual({
        page: 2,
        searched: true,
      });
      expect(
        schema.parse({
          startDateTime: "2026-01-01T00:00:00.1Z",
          endDateTime: "2026-01-01T00:00:00Z",
        }),
      ).toEqual({});
      const chronological = {
        startDateTime: "2026-01-01T00:00:00Z",
        endDateTime: "2026-01-01T00:00:00.1Z",
      };
      expect(schema.parse(chronological)).toEqual({
        ...chronological,
        searched: true,
      });
    });
  },
);

it("removes search intent and explicit defaults from immediate record URLs", () => {
  for (const { schema, contract } of cases.filter(
    ({ name }) => name === "counsel" || name === "appeal",
  )) {
    expect(schema.parse({ ...contract.defaults, searched: true })).toEqual({});
    expect(schema.parse({ searched: false })).toEqual({});
  }
});
