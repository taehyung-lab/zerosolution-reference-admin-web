import { describe, expect, it } from "vitest";
import { managerApiSortTypes } from "../../../api/manager-list-contract";
import {
  managerSortFields,
  managerSortTypes,
  sortDirectionFor,
  sortTypeOfColumn,
} from "./manager-sort";

describe("managerSortFields", () => {
  it("exposes only rehearsal sort keys that have a Figma column and never AGENCY", () => {
    expect(managerSortTypes).toEqual([
      "CREATED_AT",
      "UPDATED_AT",
      "TYPE",
      "ID",
      "NAME",
      "ORGANIZATION",
      "PERMISSION",
      "STATUS",
    ]);
    expect(managerSortTypes).not.toContain("AGENCY");
    for (const sortType of managerSortTypes) {
      expect(Object.values(managerApiSortTypes)).toContain(sortType);
    }
  });

  it("pairs each exposed sort key with exactly one column", () => {
    const columnIds = managerSortTypes.map(
      (type) => managerSortFields[type].columnId,
    );
    expect(new Set(columnIds).size).toBe(columnIds.length);
  });

  it("maps the active sort key to its aria-sort direction and every other key to no direction", () => {
    const sort = { type: "NAME", direction: "ASC" } as const;
    expect(sortDirectionFor(sort, "NAME")).toBe("ascending");
    expect(sortDirectionFor({ ...sort, direction: "DESC" }, "NAME")).toBe(
      "descending",
    );
    expect(sortDirectionFor(sort, "CREATED_AT")).toBeUndefined();
  });

  it("finds the sort key of a sortable column and none for a plain column", () => {
    expect(sortTypeOfColumn("createdAt")).toBe("CREATED_AT");
    expect(sortTypeOfColumn("phone")).toBeUndefined();
    expect(sortTypeOfColumn("registrationRoute")).toBeUndefined();
  });
});
