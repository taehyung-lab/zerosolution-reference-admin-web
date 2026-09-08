import { defineSearchFields } from "@/shared/lib/search-fields";
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArrayItems,
} from "@/shared/lib/search-codecs";
import {
  normalizeClosedInstantRange,
  omitSearchDefaults,
  resolveSearchDefaults,
} from "@/shared/lib/search";
import {
  memberKeywordTypes,
  memberPageSizes,
  memberPeriodTypes,
  memberSortDirections,
  memberSortTypes,
  type MemberSearch,
} from "../../../model/member-search";
/**
 * 활성 회원 URL 검색을 검증하고 화면별 고정 조건·기본값·필터/보기 상태의 구분을 정의한다.
 * API 연결 후에도 유지할 화면 계약이며 요청 DTO 변환과 캐시 키는 확정된 서버 계약에 맞춰 연결한다.
 */
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import { z } from "zod";
import {
  memberAccountStatuses,
  memberRestrictions,
  memberSignupMethods,
} from "../../../model/account";
export {
  memberAccountStatuses,
  memberRestrictions,
  memberSignupMethods,
} from "../../../model/account";

const memberCommonFields = {
  periodType: {
    schema: z.enum(memberPeriodTypes).optional().catch(undefined),
    defaultValue: "joinedAt",
    kind: "filter",
  },
  startDateTime: {
    schema: optionalInstant,
    defaultValue: undefined,
    kind: "filter",
  },
  endDateTime: {
    schema: optionalInstant,
    defaultValue: undefined,
    kind: "filter",
  },
  keywords: {
    schema: recoverArrayItems(
      z.object({
        field: z.enum(memberKeywordTypes),
        value: z.string().trim().min(1),
      }),
    ),
    defaultValue: [],
    kind: "filter",
  },
  signupMethods: {
    schema: recoverArrayItems(z.enum(memberSignupMethods)),
    defaultValue: [],
    kind: "filter",
  },
  sortType: {
    schema: z.enum(memberSortTypes).optional().catch(undefined),
    defaultValue: "joinedAt",
    kind: "view",
  },
  sortDirection: {
    schema: z.enum(memberSortDirections).optional().catch(undefined),
    defaultValue: "desc",
    kind: "view",
  },
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: "view" },
  pageSize: {
    schema: z.coerce
      .number()
      .pipe(z.union(memberPageSizes.map((value) => z.literal(value))))
      .optional()
      .catch(undefined),
    defaultValue: 100,
    kind: "view",
  },
} as const;
export const memberSearchFields = {
  ...memberCommonFields,
  accountStatuses: {
    schema: recoverArrayItems(z.enum(memberAccountStatuses)),
    defaultValue: [],
    kind: "filter",
  },
  restrictions: {
    schema: recoverArrayItems(z.enum(memberRestrictions)),
    defaultValue: [],
    kind: "filter",
  },
} as const;
export const memberSearchContract = defineSearchFields(memberSearchFields);
export const memberSearchDefaults = memberSearchContract.defaults;
export const memberSearchPartition = memberSearchContract.partition;

export const memberSearchSchema = memberSearchContract.schema;

type MemberSearchFields = z.output<typeof memberSearchSchema>;
export type MemberRouteSearch = Partial<MemberSearchFields> & {
  readonly searched?: true;
};

export const generalMemberSearchContract =
  defineSearchFields(memberCommonFields);
export const flaggedMemberSearchContract = defineSearchFields({
  ...memberCommonFields,
  restrictions: memberSearchFields.restrictions,
});
export const memberSearchContracts = {
  all: memberSearchContract,
  general: generalMemberSearchContract,
  flagged: flaggedMemberSearchContract,
};
export type MemberListVariant = keyof typeof memberSearchContracts;

function canonicalMemberSearch({
  searched,
  ...fields
}: MemberRouteSearch): MemberRouteSearch {
  const valid = compactSearchValues(normalizeClosedInstantRange(fields));
  if (searched !== true && Object.keys(valid).length === 0) return {};
  return { ...omitSearchDefaults(valid, memberSearchDefaults), searched: true };
}
const searchIntent = { searched: z.literal(true).optional().catch(undefined) };
export const memberCanonicalSearchSchema = memberSearchSchema
  .extend(searchIntent)
  .transform(canonicalMemberSearch);
export const allMemberCanonicalSearchSchema = memberCanonicalSearchSchema;
export const generalMemberCanonicalSearchSchema =
  generalMemberSearchContract.schema
    .extend(searchIntent)
    .transform(canonicalMemberSearch);
export const flaggedMemberCanonicalSearchSchema =
  flaggedMemberSearchContract.schema
    .extend(searchIntent)
    .transform(canonicalMemberSearch);
export const memberCanonicalSearchSchemas = {
  all: allMemberCanonicalSearchSchema,
  general: generalMemberCanonicalSearchSchema,
  flagged: flaggedMemberCanonicalSearchSchema,
};

export function resolveMemberSearch(
  search: MemberRouteSearch,
  variant: MemberListVariant = "all",
): MemberSearch {
  const contract = memberSearchContracts[variant];
  const resolved = resolveSearchDefaults(
    contract.schema.parse(search),
    contract.defaults,
  );
  // Variant-hidden conditions stay empty in the domain request model, never in the variant URL schema.
  return { ...memberSearchDefaults, ...resolved };
}

export function toMemberRouteSearch(search: MemberSearch): MemberRouteSearch {
  return memberCanonicalSearchSchema.parse({ ...search, searched: true });
}
