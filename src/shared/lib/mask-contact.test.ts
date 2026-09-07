import { describe, expect, it } from "vitest";
import { maskEmail, maskPhone } from "./mask-contact";

describe("existing contact display rules", () => {
  it.each([
    ["member@example.com", "memb**@example.com"],
    ["abc@example.com", "abc@example.com"],
  ])("masks email %s", (input, output) => {
    expect(maskEmail(input)).toBe(output);
  });
  it.each([
    ["010-1234-5678", "010-****-5678"],
    ["01012345678", "010****5678"],
    ["1234", "1234"],
  ])("masks phone %s", (input, output) => {
    expect(maskPhone(input)).toBe(output);
  });
});
