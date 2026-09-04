export function compactSearchValues<T extends Record<string, unknown>>(
  values: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0),
    ),
  ) as Partial<T>;
}
