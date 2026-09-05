import { compactSearchValues } from '@/shared/lib/compact-search-values';
import { resolveSearchDefaults, type Resolved } from '@/shared/lib/search';
import type { SearchFieldPartition } from '@/shared/lib/search-partition';
import { z } from 'zod';
import {
  managerPeriodTypes,
  managerRegistrationRouteTypes,
  managerSortDirections,
  managerStatuses,
  managerTypes,
  type ManagerPeriodType,
} from '../api/manager-list-contract';
import { managerSortTypes } from './manager-sort';

const defaultManagerPeriodType: ManagerPeriodType = 'CREATED_AT';

const sparseArray = <T extends z.ZodType>(item: T) =>
  z
    .array(z.unknown())
    .transform((values) =>
      values.flatMap((value) => {
        const parsed = item.safeParse(value);
        return parsed.success ? [parsed.data] : [];
      }),
    )
    .optional()
    .catch(undefined);

function isManagerPeriodInstantRangeOrdered(
  start: string | undefined,
  end: string | undefined,
): boolean {
  return (
    start === undefined ||
    end === undefined ||
    Date.parse(start) <= Date.parse(end)
  );
}

export const managerSearchSchema = z.object({
  keywords: sparseArray(
    z.object({
      keywordType: z.enum([
        'ID',
        'NAME',
        'PHONE',
        'ORGANIZATION',
        'PERMISSION',
      ]),
      keyword: z.string().min(1),
    }),
  ),
  periodType: z
    .enum(managerPeriodTypes)
    .optional()
    .catch(undefined),
  types: sparseArray(
    z.enum(managerTypes),
  ),
  statuses: sparseArray(
    z.enum(managerStatuses),
  ),
  agencyIds: sparseArray(z.coerce.number()),
  registrationRouteTypes: sparseArray(
    z.enum(managerRegistrationRouteTypes),
  ),
  sortType: z
    .enum(managerSortTypes)
    .optional()
    .catch(undefined),
  sortDirection: z
    .enum(managerSortDirections)
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  pageSize: z.coerce.number().int().min(1).optional().catch(undefined),
  startDateTime: z.iso.datetime().optional().catch(undefined),
  endDateTime: z.iso.datetime().optional().catch(undefined),
});

type ManagerRouteSearchFields = z.output<typeof managerSearchSchema>;

export type ManagerUnsearchedRouteSearch = {
  readonly [K in keyof ManagerRouteSearchFields]?: never;
};

export type ManagerSearchedRouteSearch = Omit<
  ManagerRouteSearchFields,
  'periodType'
> & {
  readonly periodType: ManagerPeriodType;
};

export type ManagerRouteSearch =
  | ManagerUnsearchedRouteSearch
  | ManagerSearchedRouteSearch;

export const managerCanonicalSearchSchema = managerSearchSchema.transform(
  (search): ManagerRouteSearch => {
    let validSearch = search;
    if (
      !isManagerPeriodInstantRangeOrdered(
        validSearch.startDateTime,
        validSearch.endDateTime,
      )
    ) {
      validSearch = { ...validSearch };
      delete validSearch.startDateTime;
      delete validSearch.endDateTime;
    }

    const sparseValidSearch = compactSearchValues(validSearch);
    if (Object.keys(sparseValidSearch).length === 0) return {};
    return {
      ...sparseValidSearch,
      periodType: sparseValidSearch.periodType ?? defaultManagerPeriodType,
    };
  },
);

export type ManagerRouteSearchInput = z.output<typeof managerSearchSchema>;

/**
 * Which route-search fields belong to the filter draft and which are view state. Adding a
 * schema field without classifying it here is a compile error, so the filter identity and the
 * draft overlay can no longer drift apart.
 */
export const managerSearchPartition = {
  keywords: 'filter',
  periodType: 'filter',
  types: 'filter',
  statuses: 'filter',
  agencyIds: 'filter',
  registrationRouteTypes: 'filter',
  startDateTime: 'filter',
  endDateTime: 'filter',
  sortType: 'view',
  sortDirection: 'view',
  page: 'view',
  pageSize: 'view',
} as const satisfies SearchFieldPartition<ManagerRouteSearch>;

export const managerSearchDefaults = {
  keywords: [],
  periodType: defaultManagerPeriodType,
  types: [],
  statuses: [],
  agencyIds: [],
  registrationRouteTypes: [],
  sortType: 'CREATED_AT',
  sortDirection: 'DESC',
  page: 1,
  pageSize: 100,
  startDateTime: undefined as string | undefined,
  endDateTime: undefined as string | undefined,
} as const satisfies Readonly<Record<keyof ManagerRouteSearch, unknown>> &
  Partial<ManagerRouteSearch>;

export type ManagerSearch = Resolved<
  ManagerRouteSearch,
  typeof managerSearchDefaults
>;

export function resolveManagerSearch(search: ManagerRouteSearch): ManagerSearch {
  return resolveSearchDefaults(search, managerSearchDefaults);
}

export function toManagerRouteSearch(
  search: ManagerSearch,
): ManagerRouteSearch {
  const { periodType, ...routeValues } = search;
  return {
    periodType,
    ...compactSearchValues({
      ...routeValues,
      sortType:
        search.sortType === managerSearchDefaults.sortType
          ? undefined
          : search.sortType,
      sortDirection:
        search.sortDirection === managerSearchDefaults.sortDirection
          ? undefined
          : search.sortDirection,
      page: search.page > 1 ? search.page : undefined,
      pageSize:
        search.pageSize === managerSearchDefaults.pageSize
          ? undefined
          : search.pageSize,
    }),
  };
}
