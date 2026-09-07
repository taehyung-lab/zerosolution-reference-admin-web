import { describe, expect, it } from "vitest";
import {
  findMemberFixture,
  selectMemberProfilePage,
  selectMemberActivityFixture,
} from "./members";
import { resolveMemberSearch } from "../list/model/search-schema";

describe("explicit member reference data", () => {
  it("isolates activity targets by member and tab and exposes the second page", () => {
    const first = selectMemberActivityFixture("example-flagged", {
      tab: "ticket",
      keyword: "",
      page: 1,
      pageSize: 100,
    });
    const second = selectMemberActivityFixture("example-flagged", {
      tab: "ticket",
      keyword: "",
      page: 2,
      pageSize: 100,
    });
    const other = selectMemberActivityFixture("example-general", {
      tab: "entry",
      keyword: "",
      page: 1,
      pageSize: 100,
    });
    expect(first.rows).toHaveLength(100);
    expect(second.rows).toHaveLength(1);
    expect(other.rows[0]?.id).not.toBe(first.rows[0]?.id);
    expect(second.rows[0]?.id).not.toBe(first.rows[0]?.id);
  });
  it("filters the product variants before paging and preserves stable detail identity", () => {
    const general = selectMemberProfilePage(
      resolveMemberSearch({ periodType: "joinedAt" }),
      "general",
    );
    const flagged = selectMemberProfilePage(
      resolveMemberSearch({ periodType: "joinedAt" }),
      "flagged",
    );
    expect(general.total).toBe(1);
    expect(flagged.total).toBe(1);
    expect(general.rows[0]?.id).not.toBe(flagged.rows[0]?.id);
    expect(
      findMemberFixture(flagged.rows[0]!.id)?.values.restrictions,
    ).toEqual(["inquiry"]);
  });
  it("answers keyword filters with unmasked facts and rejects unknown member IDs", () => {
    const data = selectMemberProfilePage(
      resolveMemberSearch({
        keywords: [{ field: "email", value: "flagged@example.test" }],
      }),
      "all",
    );
    expect(data.total).toBe(1);
    expect(data.rows[0]?.email).toBe("flagged@example.test");
    expect(findMemberFixture("unknown")).toBeUndefined();
    expect(
      selectMemberProfilePage(
        resolveMemberSearch({
          keywords: [{ field: "name", value: "no match" }],
        }),
        "all",
      ).total,
    ).toBe(0);
  });
});
