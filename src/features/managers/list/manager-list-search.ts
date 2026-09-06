import { z } from 'zod';
import { compactSearchValues } from '@/shared/lib/compact-search-values';

const states = ['awaiting', 'rejected', 'active', 'inactive', 'locked'] as const;
export const managerListSorts = [
  'joinedAt',
  'lastAccessAt',
  'type',
  'organization',
  'id',
  'name',
  'phone',
  'email',
  'permission',
  'registrationRoute',
  'accountStatus',
] as const;

/** Product UI values stop before wire mapping; no rehearsal enum is extended. */
export const managerListSearchSchema = z
  .object({
    periodType: z.enum(['joinedAt', 'lastAccessAt']).optional().catch(undefined),
    keywords: z
      .array(
        z.object({
          field: z.enum(['id', 'name', 'phone', 'email']),
          value: z.string().min(1),
        }),
      )
      .optional()
      .catch(undefined),
    types: z.array(z.string()).optional().catch(undefined),
    permission: z.string().optional().catch(undefined),
    statuses: z.array(z.enum(states)).optional().catch(undefined),
    registrationRoutes: z
      .array(z.enum(['WEB', 'APP']))
      .optional()
      .catch(undefined),
    startDateTime: z.iso.datetime().optional().catch(undefined),
    endDateTime: z.iso.datetime().optional().catch(undefined),
    sort: z.enum(managerListSorts).optional().catch(undefined),
    direction: z.enum(['asc', 'desc']).optional().catch(undefined),
    page: z.coerce.number().int().positive().optional().catch(undefined),
    pageSize: z
      .enum(['100', '200', '300', '400', '500', '700', '1000'])
      .or(z.number().refine((value) => [100, 200, 300, 400, 500, 700, 1000].includes(value)))
      .transform(Number)
      .optional()
      .catch(undefined),
  })
  .transform((value) => {
    if (value.startDateTime && value.endDateTime && value.startDateTime > value.endDateTime) {
      value.startDateTime = undefined;
      value.endDateTime = undefined;
    }
    return compactSearchValues(value);
  });
export type ManagerListSearch = z.output<typeof managerListSearchSchema>;

export function managerListFilter(search: ManagerListSearch) {
  return {
    periodType: search.periodType ?? 'joinedAt',
    keywords: search.keywords ?? [],
    types: search.types ?? [],
    permission: search.permission ?? '',
    statuses: search.statuses ?? [],
    registrationRoutes: search.registrationRoutes ?? [],
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
  };
}
