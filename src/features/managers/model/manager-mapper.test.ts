import { describe, expect, it } from "vitest";
import { toManagerListItem } from "./manager-mapper";

describe("toManagerListItem", () => {
  it("preserves the server updatedAt value for the visible last-access column", () => {
    expect(
      toManagerListItem({
        id: "manager-1",
        createdAt: "2026-08-28T00:00:00Z",
        updatedAt: "2026-08-31T00:00:00Z",
      }),
    ).toMatchObject({ updatedAt: "2026-08-31T00:00:00Z" });
  });
});
