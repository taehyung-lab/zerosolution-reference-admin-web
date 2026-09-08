import { z } from "zod";
import type { SearchFieldKind } from "./search-partition";

type SearchField = {
  readonly schema: z.ZodType;
  readonly defaultValue: unknown;
  readonly kind: SearchFieldKind;
};

export function defineSearchFields<const T extends Record<string, SearchField>>(
  fields: T & {
    [K in keyof T]: {
      readonly defaultValue: Readonly<z.output<T[K]["schema"]>>;
    };
  },
) {
  const entries = Object.entries(fields);
  // Object.fromEntries loses the field-to-value relationship; all three maps use the same source keys.
  const shape = Object.fromEntries(
    entries.map(([key, field]) => [key, field.schema]),
  ) as {
    [K in keyof T]: T[K]["schema"];
  };
  const defaults = Object.fromEntries(
    entries.map(([key, field]) => [key, field.defaultValue]),
  ) as {
    [K in keyof T]: undefined extends T[K]["defaultValue"]
      ? z.output<T[K]["schema"]>
      : Exclude<z.output<T[K]["schema"]>, undefined>;
  };
  const partition = Object.fromEntries(
    entries.map(([key, field]) => [key, field.kind]),
  ) as {
    [K in keyof T]: T[K]["kind"];
  };
  return { schema: z.object(shape), defaults, partition };
}
