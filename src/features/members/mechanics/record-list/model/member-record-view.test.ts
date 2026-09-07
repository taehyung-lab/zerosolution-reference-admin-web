import { describe, expect, it } from "vitest";
import { toggleMemberRecordSort } from "./member-record-view";

describe("secondary member sort transition", () => {
  it("toggles an ascending active sort and resets only the page", () => {
    const search = {
      periodType: "accessedAt",
      sortType: "email",
      sortDirection: "asc" as const,
      page: 3,
      pageSize: 100 as const,
    };
    expect(toggleMemberRecordSort(search, "email")).toEqual({
      ...search,
      sortDirection: "desc",
      page: undefined,
    });
    expect(search.page).toBe(3);
  });
  it("starts another column ascending and keeps all committed filters", () => {
    const search = {
      periodType: "receivedAt",
      inquiryType: "booking",
      sortType: "email",
      sortDirection: "desc" as const,
    };
    expect(toggleMemberRecordSort(search, "receivedAt")).toEqual({
      ...search,
      sortType: "receivedAt",
      sortDirection: "asc",
      page: undefined,
    });
  });
});
