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
import { type MemberRecordSearch } from "../../../model/member-record-search";
/**
 * 기록 목록별로 URL에서 허용할 검색 필드·정렬·페이지와 잘못된 값의 복구 규칙을 정의한다.
 * 실제 API에서도 URL 검증은 필요하다. 이 화면용 이름을 서버 파라미터로 그대로 간주하지 않고 계약별로 변환한다.
 */
import { standardPageSizeOptions } from "@/shared/model/list-options";
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import { z } from "zod";
import {
  memberAccountStatuses,
  memberSignupMethods,
} from "../../../model/account";

const keyword = z.object({
  field: z.enum(["email", "name", "phone", "content"]),
  value: z.string().trim().min(1),
});
const recordFields = {
  periodType: {
    schema: z.string().optional().catch(undefined),
    defaultValue: undefined,
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
    schema: recoverArrayItems(keyword),
    defaultValue: [],
    kind: "filter",
  },
  signupMethods: {
    schema: recoverArrayItems(z.enum(memberSignupMethods)),
    defaultValue: [],
    kind: "filter",
  },
  accountStatuses: {
    schema: recoverArrayItems(z.enum(memberAccountStatuses)),
    defaultValue: [],
    kind: "filter",
  },
  restrictions: {
    schema: recoverArrayItems(z.enum(["specialContent", "inquiry"])),
    defaultValue: [],
    kind: "filter",
  },
  statuses: {
    schema: recoverArrayItems(
      z.enum(["waiting", "reviewing", "held", "completed"]),
    ),
    defaultValue: [],
    kind: "filter",
  },
  results: {
    schema: recoverArrayItems(z.enum(["waiting", "completed", "rejected"])),
    defaultValue: [],
    kind: "filter",
  },
  inquiryType: {
    schema: z.string().optional().catch(undefined),
    defaultValue: undefined,
    kind: "filter",
  },
  accessPaths: {
    schema: recoverArrayItems(z.literal("app")),
    defaultValue: [],
    kind: "filter",
  },
  sortType: {
    schema: z.string().optional().catch(undefined),
    defaultValue: undefined,
    kind: "view",
  },
  sortDirection: {
    schema: z.enum(["asc", "desc"]).optional().catch(undefined),
    defaultValue: "desc",
    kind: "view",
  },
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: "view" },
  pageSize: {
    schema: z.coerce
      .number()
      .pipe(z.union(standardPageSizeOptions.map((size) => z.literal(size))))
      .optional()
      .catch(undefined),
    defaultValue: 100,
    kind: "view",
  },
} as const;
export const memberRecordSearchContract = defineSearchFields(recordFields);
export type MemberRecordRouteSearch = MemberRecordSearch & {
  readonly searched?: true;
};
const searchIntent = z.literal(true).optional().catch(undefined);
function canonical<TSearch extends MemberRecordRouteSearch>(
  { searched, ...fields }: TSearch,
  defaults: object,
) {
  const valid = compactSearchValues(normalizeClosedInstantRange(fields));
  const sparse = omitSearchDefaults(valid, defaults);
  return searched || Object.keys(valid).length > 0
    ? { ...sparse, searched: true as const }
    : sparse;
}

export const dormantSearchFields = {
  periodType: {
    schema: z
      .enum(["joinedAt", "lastAccessedAt", "dormantAt"])
      .optional()
      .catch(undefined),
    defaultValue: "joinedAt",
    kind: "filter",
  },
  startDateTime: recordFields.startDateTime,
  endDateTime: recordFields.endDateTime,
  keywords: {
    schema: recoverArrayItems(
      keyword.extend({ field: z.enum(["email", "name", "phone"]) }),
    ),
    defaultValue: [],
    kind: "filter",
  },
  signupMethods: recordFields.signupMethods,
  accountStatuses: recordFields.accountStatuses,
  sortType: {
    schema: z
      .enum([
        "joinedAt",
        "lastAccessedAt",
        "dormantAt",
        "signupMethod",
        "email",
        "name",
        "phone",
      ])
      .optional()
      .catch(undefined),
    defaultValue: "joinedAt",
    kind: "view",
  },
  sortDirection: recordFields.sortDirection,
  page: recordFields.page,
  pageSize: recordFields.pageSize,
} as const;
export const dormantSearchContract = defineSearchFields(dormantSearchFields);
export const dormantSearchSchema = dormantSearchContract.schema
  .extend({ searched: searchIntent })
  .transform((search) => canonical(search, dormantSearchContract.defaults));

export const withdrawnSearchFields = {
  periodType: {
    schema: z
      .enum(["joinedAt", "lastAccessedAt", "withdrawnAt"])
      .optional()
      .catch(undefined),
    defaultValue: "joinedAt",
    kind: "filter",
  },
  startDateTime: recordFields.startDateTime,
  endDateTime: recordFields.endDateTime,
  keywords: {
    schema: recoverArrayItems(keyword.extend({ field: z.literal("email") })),
    defaultValue: [],
    kind: "filter",
  },
  signupMethods: recordFields.signupMethods,
  accountStatuses: recordFields.accountStatuses,
  sortType: {
    schema: z
      .enum([
        "joinedAt",
        "lastAccessedAt",
        "withdrawnAt",
        "signupMethod",
        "email",
        "name",
        "phone",
      ])
      .optional()
      .catch(undefined),
    defaultValue: "withdrawnAt",
    kind: "view",
  },
  sortDirection: recordFields.sortDirection,
  page: recordFields.page,
  pageSize: recordFields.pageSize,
} as const;
export const withdrawnSearchContract = defineSearchFields(
  withdrawnSearchFields,
);
export const withdrawnSearchSchema = withdrawnSearchContract.schema
  .extend({ searched: searchIntent })
  .transform((search) => canonical(search, withdrawnSearchContract.defaults));

export const accessSearchFields = {
  periodType: {
    schema: z.literal("accessedAt").optional().catch(undefined),
    defaultValue: "accessedAt",
    kind: "filter",
  },
  startDateTime: recordFields.startDateTime,
  endDateTime: recordFields.endDateTime,
  keywords: {
    schema: recoverArrayItems(
      keyword.extend({ field: z.enum(["email", "name", "phone"]) }),
    ),
    defaultValue: [],
    kind: "filter",
  },
  accountStatuses: recordFields.accountStatuses,
  accessPaths: recordFields.accessPaths,
  sortType: {
    schema: z
      .enum([
        "accessedAt",
        "grade",
        "email",
        "name",
        "phone",
        "accountStatus",
        "accessPath",
      ])
      .optional()
      .catch(undefined),
    defaultValue: "accessedAt",
    kind: "view",
  },
  sortDirection: recordFields.sortDirection,
  page: recordFields.page,
  pageSize: recordFields.pageSize,
} as const;
export const accessSearchContract = defineSearchFields(accessSearchFields);
export const accessSearchSchema = accessSearchContract.schema
  .extend({ searched: searchIntent })
  .transform((search) => canonical(search, accessSearchContract.defaults));

export const counselSearchFields = {
  periodType: {
    schema: z.enum(["receivedAt", "answeredAt"]).optional().catch(undefined),
    defaultValue: "receivedAt",
    kind: "filter",
  },
  startDateTime: recordFields.startDateTime,
  endDateTime: recordFields.endDateTime,
  keywords: recordFields.keywords,
  signupMethods: recordFields.signupMethods,
  accountStatuses: recordFields.accountStatuses,
  inquiryType: recordFields.inquiryType,
  statuses: {
    schema: recoverArrayItems(z.enum(["waiting", "reviewing", "completed"])),
    defaultValue: [],
    kind: "filter",
  },
  sortType: {
    schema: z
      .enum([
        "receivedAt",
        "answeredAt",
        "email",
        "name",
        "phone",
        "inquiryType",
        "content",
        "status",
      ])
      .optional()
      .catch(undefined),
    defaultValue: "receivedAt",
    kind: "view",
  },
  sortDirection: recordFields.sortDirection,
  page: recordFields.page,
  pageSize: recordFields.pageSize,
} as const;
export const counselSearchContract = defineSearchFields(counselSearchFields);
export const counselSearchSchema = counselSearchContract.schema.transform(
  (search) =>
    omitSearchDefaults(
      normalizeClosedInstantRange(search),
      counselSearchContract.defaults,
    ),
);

export const appealSearchFields = {
  periodType: {
    schema: z.enum(["appliedAt", "flaggedAt"]).optional().catch(undefined),
    defaultValue: "appliedAt",
    kind: "filter",
  },
  startDateTime: recordFields.startDateTime,
  endDateTime: recordFields.endDateTime,
  keywords: {
    schema: recoverArrayItems(
      keyword.extend({ field: z.enum(["email", "name", "phone"]) }),
    ),
    defaultValue: [],
    kind: "filter",
  },
  restrictions: recordFields.restrictions,
  statuses: recordFields.statuses,
  results: recordFields.results,
  sortType: {
    schema: z
      .enum([
        "appliedAt",
        "flaggedAt",
        "email",
        "name",
        "phone",
        "restrictions",
      ])
      .optional()
      .catch(undefined),
    defaultValue: "appliedAt",
    kind: "view",
  },
  sortDirection: recordFields.sortDirection,
  page: recordFields.page,
  pageSize: recordFields.pageSize,
} as const;
export const appealSearchContract = defineSearchFields(appealSearchFields);
export const appealSearchSchema = appealSearchContract.schema.transform(
  (search) =>
    omitSearchDefaults(
      normalizeClosedInstantRange(search),
      appealSearchContract.defaults,
    ),
);

export type MemberRecordSearchContract =
  | typeof dormantSearchContract
  | typeof withdrawnSearchContract
  | typeof accessSearchContract
  | typeof counselSearchContract
  | typeof appealSearchContract;

export function resolveMemberRecordSearch(
  search: MemberRecordSearch,
  contract: MemberRecordSearchContract,
) {
  return resolveSearchDefaults(
    contract.schema.parse(search),
    contract.defaults,
  );
}
export type ResolvedMemberRecordSearch = ReturnType<
  typeof resolveMemberRecordSearch
>;
