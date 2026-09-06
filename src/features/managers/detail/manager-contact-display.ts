// The manager reveal popup reuses the member-common email/phone protection contract.
// Raw facts remain available to the caller's editable form and message recipient inputs.
export function maskManagerEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  return `${local.slice(0, 4)}${'*'.repeat(Math.max(0, local.length - 4))}@${domain}`;
}

export function maskManagerPhone(phone: string): string {
  return phone.replace(/^(\d{3})(.*)(\d{4})$/, (_, first: string, middle: string, last: string) =>
    `${first}${middle.replace(/\d/g, '*')}${last}`);
}
