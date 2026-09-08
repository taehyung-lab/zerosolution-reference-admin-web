import { z } from "zod";

export const optionalInstant = z.iso.datetime().optional().catch(undefined);
export const optionalPositiveInteger = z.coerce
  .number()
  .int()
  .positive()
  .optional()
  .catch(undefined);

export function recoverArray<T extends z.ZodType>(item: T) {
  return z.array(item).optional().catch(undefined);
}

export function recoverArrayItems<T extends z.ZodType>(item: T) {
  return z
    .array(z.unknown())
    .transform((values) =>
      values.flatMap((value) => {
        const parsed = item.safeParse(value);
        return parsed.success ? [parsed.data] : [];
      }),
    )
    .optional()
    .catch(undefined);
}
