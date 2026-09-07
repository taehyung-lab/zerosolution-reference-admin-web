import { formatPhoneNumber } from "../lib/format-phone-number";
import { describe, expect, it } from "vitest";
import {
  emailMessageSchema,
  smsMessageSchema,
} from "./message-schema";

const draft = {
  senderName: "운영팀",
  senderAddress: "02-1234-5678",
  recipients: [{ key: "a", address: "010-1234-5678", name: "회원" }],
  messageType: "information",
  body: "안내입니다.",
};

describe("message input", () => {
  it("formats digits from the end without imposing a phone length limit", () => {
    expect(formatPhoneNumber("0212345678")).toBe("02-1234-5678");
    expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
  });
  it("accepts SMS and rejects absent sender, recipients, or message", () => {
    expect(smsMessageSchema.safeParse(draft).success).toBe(true);
    for (const change of [
      { senderName: "" },
      { senderAddress: "invalid" },
      { recipients: [] },
      { body: "   " },
    ]) {
      expect(smsMessageSchema.safeParse({ ...draft, ...change }).success).toBe(
        false,
      );
    }
  });
  it("accepts email HTML and rejects visually empty HTML or invalid addresses", () => {
    const email = {
      ...draft,
      senderAddress: "sender@example.com",
      recipients: [{ key: "a", name: "회원", address: "member@example.com" }],
      body: "<p>Hello <strong>member</strong></p>",
    };
    expect(emailMessageSchema.safeParse(email).success).toBe(true);
    expect(
      emailMessageSchema.safeParse({ ...email, body: "<p><br></p>" }).success,
    ).toBe(false);
    expect(
      emailMessageSchema.safeParse({
        ...email,
        senderAddress: "sender+tag@example.com",
      }).success,
    ).toBe(false);
  });
});
