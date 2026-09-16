import { describe, expect, it } from "vitest";
import {
  managerListSearch,
  toManagerListRequest,
} from "@/features/managers/screens/manager-list/model/manager-list-search";
import { readManagerListPage } from "@/features/managers/fixtures/managers";
import { memberCanonicalSearchSchemas } from "@/features/members/screens/list/model/search-schema";
import {
  accessSearchSchema,
  dormantSearchSchema,
  withdrawnSearchSchema,
  counselSearchSchema,
  appealSearchSchema,
  accessSearchContract,
  resolveMemberRecordSearch,
} from "@/features/members/mechanics/record-list/model/member-record-search";
import { performanceSearchSchema } from "@/features/performances/screens/list/model/search-schema";
import { accessData } from "@/features/members/fixtures/record-pages";

const schemas = [
  ["manager", managerListSearch.canonical, true],
  ...Object.entries(memberCanonicalSearchSchemas).map(
    ([name, schema]) => [name, schema, true] as const,
  ),
  ["dormant", dormantSearchSchema, true],
  ["withdrawn", withdrawnSearchSchema, true],
  ["access", accessSearchSchema, true],
  ["counsel", counselSearchSchema, false],
  ["appeal", appealSearchSchema, false],
  ["performance", performanceSearchSchema, false],
] as const;

describe.each(schemas)("%s closed search", (_name, schema, explicit) => {
  const marker = explicit ? { searched: true } : {};
  it.each([
    { startDateTime: "2026-09-01T00:00:00Z" },
    { endDateTime: "2026-09-01T00:00:00Z" },
    { startDateTime: "wrong", endDateTime: "2026-09-01T00:00:00Z" },
    { startDateTime: "2026-09-01T00:00:00Z", endDateTime: "wrong" },
    {
      startDateTime: "2026-09-02T00:00:00Z",
      endDateTime: "2026-09-01T00:00:00Z",
    },
  ])("clears invalid pairs, not valid unrelated fields: %j", (range) => {
    expect(schema.parse(range)).toEqual({});
    expect(schema.parse({ ...range, pageSize: 200 })).toEqual({
      ...marker,
      pageSize: 200,
    });
    expect(schema.parse({ ...range, ...marker })).toEqual(marker);
  });
  it.each(["2026-09-01T00:00:00Z", "2026-09-01T00:00:00.100Z"])(
    "preserves equal/ordered instants with end %s",
    (endDateTime) => {
      const range = { startDateTime: "2026-09-01T00:00:00Z", endDateTime };
      const canonical = schema.parse(range);
      expect(canonical).toEqual({ ...range, ...marker });
      expect(schema.parse(canonical)).toEqual(canonical);
    },
  );
});

it("uses instant comparison in the manager URL-to-fixture workflow", async () => {
  const request = toManagerListRequest(
    managerListSearch.resolve(
      managerListSearch.canonical.parse({
        startDateTime: "2026-08-01T00:00:00Z",
        endDateTime: "2026-08-01T00:00:00.100Z",
      }),
    ),
  );
  expect((await readManagerListPage(request)).total).toBeGreaterThan(0);
  expect(
    (await readManagerListPage({ ...request, startDateTime: "2026-08-01T00:00:00.001Z" })).total,
  ).toBe(0);
});

it("uses instant comparison in the record URL-to-fixture workflow", () => {
  const search = resolveMemberRecordSearch(
    accessSearchSchema.parse({
      startDateTime: "2026-09-01T00:00:00Z",
      endDateTime: "2026-09-01T00:00:00.100Z",
    }),
    accessSearchContract,
  );
  expect(accessData(search).total).toBe(101);
  expect(
    accessData({ ...search, startDateTime: "2026-09-01T00:00:00.001Z" }).total,
  ).toBe(0);
});
