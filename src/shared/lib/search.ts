import { compactSearchValues } from "./compact-search-values";

export type Resolved<
  TSparse extends object,
  TDefaults extends Readonly<Record<keyof TSparse, unknown>>,
> = {
  readonly [K in keyof TDefaults]-?: undefined extends TDefaults[K]
    ? TSparse[K & keyof TSparse]
    : Exclude<TSparse[K & keyof TSparse], undefined>;
};

export function resolveSearchDefaults<
  TSparse extends object,
  const TDefaults extends Readonly<Record<keyof TSparse, unknown>>,
>(
  sparse: TSparse,
  defaults: TDefaults & {
    readonly [K in keyof TSparse]?: TSparse[K];
  },
): Resolved<TSparse, TDefaults> {
  const sparseValues = sparse as Record<string, unknown>;
  const defaultValues = defaults as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(defaults).map((key) => [
      key,
      sparseValues[key] ?? defaultValues[key],
    ]),
  ) as Resolved<TSparse, TDefaults>;
}

export interface SearchParser<TSearch extends Record<string, unknown>> {
  parse(input: unknown): TSearch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonLikeEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => jsonLikeEqual(value, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key) =>
        Object.hasOwn(right, key) && jsonLikeEqual(left[key], right[key]),
    )
  );
}

export function canonicalizeRouteSearch<
  TSearch extends Record<string, unknown>,
>(
  schema: SearchParser<TSearch>,
  rawSearch: unknown,
): {
  readonly search: Partial<TSearch>;
  readonly changed: boolean;
} {
  const search = compactSearchValues(schema.parse(rawSearch));
  return { search, changed: !jsonLikeEqual(rawSearch, search) };
}

export function nonEmptyArray<T>(values: readonly T[]): T[] | undefined {
  return values.length > 0 ? [...values] : undefined;
}

type InstantRange = {
  readonly startDateTime?: string | undefined;
  readonly endDateTime?: string | undefined;
};

// Use only at a committed-search boundary; an editable draft may have one bound.
export function normalizeClosedInstantRange<T extends InstantRange>(
  value: T,
): Omit<T, keyof InstantRange> & InstantRange {
  if (value.startDateTime === undefined && value.endDateTime === undefined)
    return value;
  const start = Date.parse(value.startDateTime ?? "");
  const end = Date.parse(value.endDateTime ?? "");
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    return { ...value, startDateTime: undefined, endDateTime: undefined };
  }
  return value;
}

export function omitSearchDefaults<T extends object>(
  search: T,
  defaults: object,
): Partial<T> {
  const defaultValues = defaults as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(search).filter(
      ([key, value]) =>
        value !== undefined &&
        !(Array.isArray(value) && value.length === 0) &&
        (!Object.hasOwn(defaultValues, key) ||
          !jsonLikeEqual(value, defaultValues[key])),
    ),
  ) as Partial<T>;
}

export function toTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
