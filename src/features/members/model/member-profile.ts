import type { MemberEditValues } from "../form/member-edit-schema";

export interface MemberProfile {
  readonly id: string;
  readonly email: string;
  readonly values: MemberEditValues;
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly signupMethod: "direct" | "kakao" | "naver" | "apple" | "melon";
}

export function maskMemberEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 4)}${"*".repeat(Math.max(0, local.length - 4))}@${domain}`;
}

export function maskMemberPhone(phone: string): string {
  return phone.replace(
    /^(\d{3})(.*)(\d{4})$/,
    (_, first: string, middle: string, last: string) =>
      `${first}${middle.replace(/\d/g, "*")}${last}`,
  );
}
