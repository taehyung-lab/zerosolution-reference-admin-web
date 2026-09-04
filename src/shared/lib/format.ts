/** Formats a count for display; the feature owns the sentence, unit and word order. */
export function formatCount(locale: string, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}
