import { z } from "zod";
import {
  normalizeClosedInstantRange,
  omitSearchDefaults,
  resolveSearchDefaults,
} from "./search";
import type { SearchFieldKind } from "./search-partition";

type SearchField = {
  readonly schema: z.ZodType;
  readonly defaultValue: unknown;
  readonly kind: SearchFieldKind;
};

/**
 * One declaration per list URL. From it every list gets the same four things:
 *
 * - `schema`: what the route validates (sparse; unknown or invalid values recover to undefined);
 * - `defaults` + `resolve`: the full search the screen works with;
 * - `partition`: which fields are filter drafts and which are view state;
 * - `canonical`: the sparse URL a full search commits to — declared defaults and empty arrays
 *   are omitted and a half-open period is dropped.
 */
export function defineSearchFields<const T extends Record<string, SearchField>>(
  fields: T & {
    [K in keyof T]: {
      readonly defaultValue: Readonly<z.output<T[K]["schema"]>>;
    };
  },
) {
  const entries = Object.entries(fields);
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
  const schema = z.object(shape);
  type Sparse = z.output<typeof schema>;
  // `sparse[key] ?? defaults[key]` has exactly the declared default's type for every key.
  type Full = typeof defaults;

  return {
    schema,
    defaults,
    partition,
    resolve: (sparse: Sparse): Full => resolveSearchDefaults(sparse, defaults as never),
    canonical: schema.transform((value) =>
      omitSearchDefaults(normalizeClosedInstantRange(value), defaults),
    ),
  };
}
