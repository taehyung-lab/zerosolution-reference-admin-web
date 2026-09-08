import { describe, expect, expectTypeOf, it } from "vitest";
import { memberPageSizes, memberSortTypes } from "../../../model/member-search";
import {
  allMemberCanonicalSearchSchema,
  memberSearchContract,
  generalMemberSearchContract,
  flaggedMemberSearchContract,
  flaggedMemberCanonicalSearchSchema,
  generalMemberCanonicalSearchSchema,
  memberCanonicalSearchSchema,
  resolveMemberSearch,
  toMemberRouteSearch,
  memberCanonicalSearchSchemas,
} from "./search-schema";

describe("member route search", () => {
  it("keeps the confirmed page-size and sort options as one typed fact", () => {
    expect(memberPageSizes).toEqual([100, 200, 300, 400, 500, 700, 1000]);
    expect(memberSortTypes).toEqual([
      "joinedAt",
      "lastAccessedAt",
      "signupMethod",
      "email",
      "name",
      "phone",
    ]);
  });

  it("keeps an empty URL unsearched and supplies resolved defaults after search", () => {
    expect(memberCanonicalSearchSchema.parse({})).toEqual({});
    expect(resolveMemberSearch({ periodType: "joinedAt" })).toMatchObject({
      page: 1,
      pageSize: 100,
      sortType: "joinedAt",
      sortDirection: "desc",
    });
  });

  it("recovers valid values and omits defaults from the committed URL", () => {
    expect(
      memberCanonicalSearchSchema.parse({
        periodType: "joinedAt",
        page: "2",
        pageSize: "invalid",
        signupMethods: ["direct", "unknown"],
      }),
    ).toEqual({
      searched: true,
      page: 2,
      signupMethods: ["direct"],
    });
    expect(
      toMemberRouteSearch(resolveMemberSearch({ periodType: "joinedAt" })),
    ).toEqual({ searched: true });
  });

  it("removes filters that are not owned by the general and flagged routes", () => {
    const input = {
      periodType: "joinedAt",
      accountStatuses: ["general"],
      restrictions: ["entry"],
    };
    expect(allMemberCanonicalSearchSchema.parse(input)).toEqual({ searched: true, accountStatuses: input.accountStatuses, restrictions: input.restrictions });
    expect(generalMemberCanonicalSearchSchema.parse(input)).toEqual({
      searched: true,
    });
    expect(flaggedMemberCanonicalSearchSchema.parse(input)).toEqual({
      searched: true,
      restrictions: ["entry"],
    });
  });

  it("drops a reversed instant range while preserving other valid search values", () => {
    expect(
      memberCanonicalSearchSchema.parse({
        periodType: "lastAccessedAt",
        startDateTime: "2026-09-05T00:00:00.000Z",
        endDateTime: "2026-09-01T00:00:00.000Z",
        page: 2,
      }),
    ).toEqual({ periodType: "lastAccessedAt", page: 2, searched: true });
  });
});

it('normalizes direct search intent idempotently and keeps it out of resolved values', () => {
  for (const schema of Object.values(memberCanonicalSearchSchemas)) {
    for (const input of [{ searched: true }, { page: 1 }, { page: 2, searched: false }, { periodType: 'joinedAt' }]) {
      const canonical = schema.parse(input);
      expect(canonical.searched).toBe(true);
      expect(schema.parse(canonical)).toEqual(canonical);
      expect(resolveMemberSearch(canonical)).not.toHaveProperty('searched');
    }
    for (const input of [{ searched: false }, { page: 'wrong' }, { unknown: 'value' }, { keywords: [] }]) {
      expect(schema.parse(input)).toEqual({});
    }
    expect(schema.parse({ searched: true, page: 'wrong' })).toEqual({ searched: true });
  }
});

it("derives exact variant fields and ignores hidden-only URL conditions", () => {
  const common = [
    "periodType",
    "startDateTime",
    "endDateTime",
    "keywords",
    "signupMethods",
    "sortType",
    "sortDirection",
    "page",
    "pageSize",
  ];
  for (const [contract, extra] of [
    [memberSearchContract, ["accountStatuses", "restrictions"]],
    [generalMemberSearchContract, []],
    [flaggedMemberSearchContract, ["restrictions"]],
  ] as const) {
    for (const value of [
      contract.schema.shape,
      contract.defaults,
      contract.partition,
    ])
      expect(Object.keys(value).sort()).toEqual([...common, ...extra].sort());
  }
  expect(
    generalMemberCanonicalSearchSchema.parse({ accountStatuses: ["general"] }),
  ).toEqual({});
  expect(
    flaggedMemberCanonicalSearchSchema.parse({ accountStatuses: ["general"] }),
  ).toEqual({});
  expectTypeOf<
    keyof typeof generalMemberSearchContract.defaults
  >().toEqualTypeOf<keyof typeof generalMemberSearchContract.schema.shape>();
  expectTypeOf(memberSearchContract.schema.parse({}).pageSize).toEqualTypeOf<
    100 | 200 | 300 | 400 | 500 | 700 | 1000 | undefined
  >();
});
