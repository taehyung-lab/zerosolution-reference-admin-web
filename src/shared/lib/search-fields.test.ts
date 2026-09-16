import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { defineSearchFields } from "./search-fields";
import { resolveSearchDefaults } from "./search";
import { filterPartitionValues } from "./search-partition";

describe("search field declaration", () => {
  const fields = {
    page: { schema: z.number().optional(), defaultValue: 1, kind: "view" },
    status: {
      schema: z.enum(["open", "closed"]).optional(),
      defaultValue: "open",
      kind: "filter",
    },
    tags: {
      schema: z.array(z.string()).optional(),
      defaultValue: [],
      kind: "filter",
    },
    direction: {
      schema: z.enum(["asc", "desc"]).optional(),
      defaultValue: undefined,
      kind: "view",
    },
  } as const;
  const contract = defineSearchFields(fields);

  it("keeps URL sparse while resolving all declared defaults and excluding view state from drafts", () => {
    expect(contract.schema.parse({})).toEqual({});
    const resolved = resolveSearchDefaults(
      contract.schema.parse({}),
      contract.defaults,
    );
    expect(resolved).toEqual({
      page: 1,
      status: "open",
      tags: [],
      direction: undefined,
    });
    expect(filterPartitionValues(resolved, contract.partition)).toEqual({
      status: "open",
      tags: [],
    });
    expect(
      resolveSearchDefaults(
        contract.schema.parse({
          page: 2,
          status: "closed",
          tags: ["a"],
          direction: "asc",
        }),
        contract.defaults,
      ),
    ).toEqual({ page: 2, status: "closed", tags: ["a"], direction: "asc" });
    expectTypeOf(resolved.status).toEqualTypeOf<"open" | "closed">();
    expectTypeOf(resolved.direction).toEqualTypeOf<
      "asc" | "desc" | undefined
    >();
    expectTypeOf(resolved.tags).toEqualTypeOf<string[]>();
  });

  it("removes and overrides source fields before deriving every output", () => {
    const { status, ...remaining } = fields;
    const variant = defineSearchFields({
      ...remaining,
      status: {
        ...status,
        schema: z.literal("closed").optional(),
        defaultValue: "closed",
      },
      extra: {
        schema: z.boolean().optional(),
        defaultValue: false,
        kind: "filter",
      },
    });
    const reduced = defineSearchFields(remaining);
    for (const keys of [
      Object.keys(reduced.schema.shape),
      Object.keys(reduced.defaults),
      Object.keys(reduced.partition),
    ]) {
      expect(keys).toEqual(["page", "tags", "direction"]);
    }
    expect(reduced.schema.parse({ status: "open" })).toEqual({});
    expect(variant.schema.safeParse({ status: "open" }).success).toBe(false);
    expect(
      resolveSearchDefaults(variant.schema.parse({}), variant.defaults),
    ).toEqual({
      page: 1,
      tags: [],
      direction: undefined,
      status: "closed",
      extra: false,
    });
    expectTypeOf<keyof typeof reduced.defaults>().toEqualTypeOf<
      "page" | "tags" | "direction"
    >();
    expectTypeOf(variant.defaults.status).toEqualTypeOf<"closed">();
  });

  it("resolves and commits through the same declaration", () => {
    expect(contract.resolve({ page: 2 })).toEqual({
      page: 2,
      status: "open",
      tags: [],
      direction: undefined,
    });
    expect(
      contract.canonical.parse({
        page: 1,
        status: "closed",
        tags: [],
        direction: "asc",
      }),
    ).toEqual({ status: "closed", direction: "asc" });
    expectTypeOf(contract.resolve({}).page).toEqualTypeOf<number>();
  });

  it("drops a half-open period on commit", () => {
    const period = defineSearchFields({
      startDateTime: { schema: z.string().optional(), defaultValue: undefined, kind: "filter" },
      endDateTime: { schema: z.string().optional(), defaultValue: undefined, kind: "filter" },
    });
    expect(period.canonical.parse({ startDateTime: "2026-01-01T00:00:00.000Z" })).toEqual({});
    expect(
      period.canonical.parse({
        startDateTime: "2026-01-01T00:00:00.000Z",
        endDateTime: "2026-01-02T00:00:00.000Z",
      }),
    ).toEqual({
      startDateTime: "2026-01-01T00:00:00.000Z",
      endDateTime: "2026-01-02T00:00:00.000Z",
    });
  });

  it('rejects invalid defaults and missing metadata at compile time', () => {
    const invalid = { status: { schema: z.enum(['open']), defaultValue: 'invented', kind: 'filter' } } as const;
    const missingKind = { page: { schema: z.number(), defaultValue: 1 } } as const;
    const missingDefault = { page: { schema: z.number().optional(), kind: 'view' } } as const;
    // @ts-expect-error A default cannot widen the schema enum.
    defineSearchFields(invalid);
    // @ts-expect-error Every field must declare its kind.
    defineSearchFields(missingKind);
    // @ts-expect-error Explicit undefined is required when no default applies.
    defineSearchFields(missingDefault);
  });
});
