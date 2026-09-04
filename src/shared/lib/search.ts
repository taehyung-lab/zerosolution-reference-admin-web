import { compactSearchValues } from './compact-search-values';

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
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

export function toTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
