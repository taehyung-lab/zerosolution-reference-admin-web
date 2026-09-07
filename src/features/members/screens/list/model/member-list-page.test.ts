import { describe, expect, it } from "vitest";
import type { MemberProfile } from "../../../model/member-profile";
import { memberListSearched, toMemberListRow } from "./member-list-page";

const member: MemberProfile = {
  id: "example-flagged",
  email: "flagged@example.test",
  values: {
    accountStatus: "flagged",
    restrictions: ["inquiry"],
    name: "예시불량",
    birthDate: "1990-03-03",
    phone: "010-4000-5000",
  },
  joinedAt: "2026-09-02T01:00:00Z",
  lastAccessedAt: "2026-09-05T02:00:00Z",
  signupMethod: "kakao",
};

describe("member list page mapping", () => {
  it("masks contact columns and never leaves the raw address in the row", () => {
    const row = toMemberListRow(member);
    expect(row.email).toBe("flag***@example.test");
    expect(row.phone).toBe("010-****-5000");
    expect(row.email).not.toBe(member.email);
    expect(row.phone).not.toBe(member.values.phone);
  });

  it("localizes the coded columns and keeps the stable ID as the row key", () => {
    const row = toMemberListRow(member);
    expect(row.key).toBe("example-flagged");
    expect(row.signupMethod).toBe("카카오");
    expect(row.accountStatus).toBe("불량회원");
    expect(row.restrictions).toEqual(["1:1문의"]);
    expect(row.name).toBe("예시불량");
  });

  it("renders both instants in the browser zone, not UTC", () => {
    const row = toMemberListRow(member);
    expect(row.joinedAt).toBe("2026-09-02 10:00");
    expect(row.lastAccessedAt).toBe("2026-09-05 11:00");
  });

  it("starts the query only once the committed period discriminator exists", () => {
    expect(memberListSearched({})).toBe(false);
    expect(memberListSearched({ page: 2 })).toBe(false);
    expect(memberListSearched({ periodType: "joinedAt" })).toBe(true);
  });
});
