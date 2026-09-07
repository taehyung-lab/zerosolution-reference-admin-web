export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, -4)}-${digits.slice(-4)}`;
  return `${digits.slice(0, -8)}-${digits.slice(-8, -4)}-${digits.slice(-4)}`;
}
