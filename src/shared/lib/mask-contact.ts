// 두 독립 소비자가 같은 문자열 표시 규칙을 쓰는 것이 확인돼 올렸다. 원본 연락처와 공개 권한은 호출부가 소유한다.
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 4)}${"*".repeat(Math.max(0, local.length - 4))}@${domain}`;
}

export function maskPhone(phone: string): string {
  return phone.replace(
    /^(\d{3})(.*)(\d{4})$/,
    (_, first: string, middle: string, last: string) =>
      `${first}${middle.replace(/\d/g, "*")}${last}`,
  );
}
