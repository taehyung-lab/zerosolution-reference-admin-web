import { formatDate } from "@/shared/lib/datetime";
import { describe, expect, it } from "vitest";
import { memberPasswordSchema } from "../../../model/member-password";
import { memberCreateSchema } from "./member-create-schema";

const valid = {
  email: "member@example.com",
  password: "Safe!729",
  name: "김회원",
  birthDate: "2000-02-29",
  phone: "010-1234-5678",
};

describe("member create input contract", () => {
  it("accepts documented character sets and today as the last birth date", () => {
    for (const name of ["김회원", "Jane9", "やまだ", "ヤマダー", "王小明"]) {
      expect(
        memberCreateSchema.safeParse({
          ...valid,
          name,
          birthDate: formatDate(new Date().toISOString()),
        }).success,
      ).toBe(true);
    }
  });

  it.each([
    ["email", "member+tag@example.com"],
    ["email", "invalid"],
    ["password", "short!1"],
    ["password", "onlylowercase"],
    ["name", "has space"],
    ["name", "12345678901"],
    ["birthDate", "2001-02-29"],
    ["birthDate", "2999-01-01"],
    ["phone", "010 1234 5678"],
    ["phone", "123456789012345678901"],
  ])("rejects invalid %s: %s", (field, value) => {
    expect(
      memberCreateSchema.safeParse({ ...valid, [field]: value }).success,
    ).toBe(false);
  });

  it.each(["Abc!8275", "Safe!123", "Safe!321", "Aaa!8275", "Safe!111"])(
    "rejects consecutive or repeated characters: %s",
    (password) => {
      expect(memberPasswordSchema.safeParse(password).success).toBe(false);
    },
  );

  it("requires each field", () => {
    for (const field of Object.keys(valid))
      expect(
        memberCreateSchema.safeParse({ ...valid, [field]: "" }).success,
      ).toBe(false);
  });
});
