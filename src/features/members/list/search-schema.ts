import { compactSearchValues } from '@/shared/lib/compact-search-values';
import { z } from 'zod';

export const memberPeriodTypes = ['joinedAt', 'lastAccessedAt'] as const;
export const memberKeywordTypes = ['email', 'name', 'phone'] as const;
export const memberSignupMethods = [
  'direct',
  'kakao',
  'naver',
  'apple',
  'melon',
] as const;
export const memberAccountStatuses = ['general', 'flagged'] as const;
export const memberRestrictions = ['specialContent', 'inquiry', 'entry'] as const;
export const memberSortTypes = [
  'joinedAt',
  'lastAccessedAt',
  'signupMethod',
  'email',
  'name',
  'phone',
] as const;
export const memberSortDirections = ['asc', 'desc'] as const;
export const memberPageSizes = [100, 200, 300, 400, 500, 700, 1000] as const;

const sparseArray = <T extends z.ZodType>(item: T) =>
  z
    .array(z.unknown())
    .transform((values) => values.flatMap((value) => {
      const parsed = item.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    }))
    .optional()
    .catch(undefined);

export const memberSearchSchema = z.object({
  periodType: z.enum(memberPeriodTypes).optional().catch(undefined),
  startDateTime: z.iso.datetime().optional().catch(undefined),
  endDateTime: z.iso.datetime().optional().catch(undefined),
  keywords: sparseArray(z.object({
    field: z.enum(memberKeywordTypes),
    value: z.string().trim().min(1),
  })),
  signupMethods: sparseArray(z.enum(memberSignupMethods)),
  accountStatuses: sparseArray(z.enum(memberAccountStatuses)),
  restrictions: sparseArray(z.enum(memberRestrictions)),
  sortType: z.enum(memberSortTypes).optional().catch(undefined),
  sortDirection: z.enum(memberSortDirections).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  pageSize: z.coerce.number().pipe(z.union(memberPageSizes.map((value) => z.literal(value)))).optional().catch(undefined),
});

type MemberSearchFields = z.output<typeof memberSearchSchema>;
export type MemberRouteSearch = Partial<MemberSearchFields>;

export const memberCanonicalSearchSchema = memberSearchSchema.transform((search): MemberRouteSearch => {
  let valid = search;
  if (
    valid.startDateTime !== undefined &&
    valid.endDateTime !== undefined &&
    Date.parse(valid.startDateTime) > Date.parse(valid.endDateTime)
  ) {
    valid = { ...valid, startDateTime: undefined, endDateTime: undefined };
  }
  const sparse = compactSearchValues(valid);
  if (Object.keys(sparse).length === 0) return {};
  return { ...sparse, periodType: sparse.periodType ?? 'joinedAt' };
});

export const allMemberCanonicalSearchSchema = memberCanonicalSearchSchema;
export const generalMemberCanonicalSearchSchema = memberCanonicalSearchSchema.transform(
  (search) => compactSearchValues({ ...search, accountStatuses: undefined, restrictions: undefined }),
);
export const flaggedMemberCanonicalSearchSchema = memberCanonicalSearchSchema.transform(
  (search) => compactSearchValues({ ...search, accountStatuses: undefined }),
);

export interface MemberSearch {
  readonly periodType: (typeof memberPeriodTypes)[number];
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords: readonly { readonly field: (typeof memberKeywordTypes)[number]; readonly value: string }[];
  readonly signupMethods: readonly (typeof memberSignupMethods)[number][];
  readonly accountStatuses: readonly (typeof memberAccountStatuses)[number][];
  readonly restrictions: readonly (typeof memberRestrictions)[number][];
  readonly sortType: (typeof memberSortTypes)[number];
  readonly sortDirection: (typeof memberSortDirections)[number];
  readonly page: number;
  readonly pageSize: (typeof memberPageSizes)[number];
}

export function resolveMemberSearch(search: MemberRouteSearch): MemberSearch {
  return {
    periodType: search.periodType ?? 'joinedAt',
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: search.keywords ?? [],
    signupMethods: search.signupMethods ?? [],
    accountStatuses: search.accountStatuses ?? [],
    restrictions: search.restrictions ?? [],
    sortType: search.sortType ?? 'joinedAt',
    sortDirection: search.sortDirection ?? 'desc',
    page: search.page ?? 1,
    pageSize: search.pageSize ?? 100,
  };
}

export function toMemberRouteSearch(search: MemberSearch): MemberRouteSearch {
  return {
    periodType: search.periodType,
    ...compactSearchValues({
      startDateTime: search.startDateTime,
      endDateTime: search.endDateTime,
      keywords: [...search.keywords],
      signupMethods: [...search.signupMethods],
      accountStatuses: [...search.accountStatuses],
      restrictions: [...search.restrictions],
      sortType: search.sortType === 'joinedAt' ? undefined : search.sortType,
      sortDirection: search.sortDirection === 'desc' ? undefined : search.sortDirection,
      page: search.page === 1 ? undefined : search.page,
      pageSize: search.pageSize === 100 ? undefined : search.pageSize,
    }),
  };
}
