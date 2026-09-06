import { describe, expect, it } from "vitest";
import { memberEditSchema, toMemberEditInput } from "./member-edit-schema";

const values = {
  name: "김회원",
  birthDate: "2000-01-01",
  phone: "010-1234-5678",
  accountStatus: "flagged" as const,
  restrictions: ["inquiry"],
};

describe("member edit restrictions", () => {
  it("retains the editing draft but clears restrictions in general-member input", () => {
    const draft = { ...values, accountStatus: "general" as const };
    expect(toMemberEditInput(draft)).toEqual({
      name: "김회원",
      birthDate: "2000-01-01",
      phone: "010-1234-5678",
      accountStatus: "general",
      restrictions: [],
    });
    expect(draft.restrictions).toEqual(["inquiry"]);
  });

  it("includes selected restrictions for a flagged member", () => {
    expect(toMemberEditInput(values).restrictions).toEqual(["inquiry"]);
  });

  it("requires restrictions only for flagged members", () => {
    expect(
      memberEditSchema.safeParse({ ...values, restrictions: [] }).success,
    ).toBe(false);
    expect(
      memberEditSchema.safeParse({
        ...values,
        accountStatus: "general",
        restrictions: [],
      }).success,
    ).toBe(true);
  });

  it("does not let hidden restriction validation block a general member", () => {
    expect(
      memberEditSchema.safeParse({
        ...values,
        accountStatus: "general",
        restrictions: ["obsolete"],
      }).success,
    ).toBe(true);
    expect(
      memberEditSchema.safeParse({ ...values, restrictions: ["obsolete"] })
        .success,
    ).toBe(false);
  });
});
