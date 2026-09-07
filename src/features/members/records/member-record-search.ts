/**
 * 기록 목록별로 URL에서 허용할 검색 필드·정렬·페이지와 잘못된 값의 복구 규칙을 정의한다.
 * 실제 API에서도 URL 검증은 필요하다. 이 화면용 이름을 서버 파라미터로 그대로 간주하지 않고 계약별로 변환한다.
 */
import { z } from "zod";
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import { standardPageSizeOptions } from "@/shared/config/list";
import { memberAccountStatuses, memberSignupMethods } from "../model/account";

const values = <T extends z.ZodType>(schema: T) =>
  z
    .array(z.unknown())
    .transform((items) =>
      items.flatMap((item) => {
        const result = schema.safeParse(item);
        return result.success ? [result.data] : [];
      }),
    )
    .optional()
    .catch(undefined);
const keyword = z.object({
  field: z.enum(["email", "name", "phone", "content"]),
  value: z.string().trim().min(1),
});
export const memberRecordSearchSchema = z.object({
  periodType: z.string().optional().catch(undefined),
  startDateTime: z.iso.datetime().optional().catch(undefined),
  endDateTime: z.iso.datetime().optional().catch(undefined),
  keywords: values(keyword),
  signupMethods: values(z.enum(memberSignupMethods)),
  accountStatuses: values(z.enum(memberAccountStatuses)),
  restrictions: values(z.enum(["specialContent", "inquiry"])),
  statuses: values(z.enum(["waiting", "reviewing", "held", "completed"])),
  results: values(z.enum(["waiting", "completed", "rejected"])),
  inquiryType: z.string().optional().catch(undefined),
  accessPaths: values(z.literal("app")),
  sortType: z.string().optional().catch(undefined),
  sortDirection: z.enum(["asc", "desc"]).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  pageSize: z.coerce
    .number()
    .pipe(z.union(standardPageSizeOptions.map((size) => z.literal(size))))
    .optional()
    .catch(undefined),
});
const common = memberRecordSearchSchema;
export type MemberRecordSearch = z.output<typeof common>;
function canonical<TSearch extends MemberRecordSearch>(
  search: TSearch,
  defaultPeriod: NoInfer<TSearch["periodType"]>,
): Partial<TSearch> {
  const next = compactSearchValues(search);
  if (
    next.startDateTime &&
    next.endDateTime &&
    next.startDateTime > next.endDateTime
  ) {
    delete next.startDateTime;
    delete next.endDateTime;
  }
  return Object.keys(next).length === 0
    ? {}
    : { ...next, periodType: next.periodType ?? defaultPeriod };
}
export const dormantSearchSchema = common
  .pick({
    periodType: true,
    startDateTime: true,
    endDateTime: true,
    keywords: true,
    signupMethods: true,
    accountStatuses: true,
    sortType: true,
    sortDirection: true,
    page: true,
    pageSize: true,
  })
  .extend({
    periodType: z
      .enum(["joinedAt", "lastAccessedAt", "dormantAt"])
      .optional()
      .catch(undefined),
    sortType: z
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
    keywords: values(
      keyword.extend({ field: z.enum(["email", "name", "phone"]) }),
    ),
  })
  .transform((search) => canonical(search, "joinedAt"));
export const withdrawnSearchSchema = common
  .pick({
    periodType: true,
    startDateTime: true,
    endDateTime: true,
    keywords: true,
    signupMethods: true,
    accountStatuses: true,
    sortType: true,
    sortDirection: true,
    page: true,
    pageSize: true,
  })
  .extend({
    periodType: z
      .enum(["joinedAt", "lastAccessedAt", "withdrawnAt"])
      .optional()
      .catch(undefined),
    sortType: z
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
    keywords: values(keyword.extend({ field: z.literal("email") })),
  })
  .transform((search) => canonical(search, "withdrawnAt"));
export const accessSearchSchema = common
  .pick({
    periodType: true,
    startDateTime: true,
    endDateTime: true,
    keywords: true,
    accountStatuses: true,
    accessPaths: true,
    sortType: true,
    sortDirection: true,
    page: true,
    pageSize: true,
  })
  .extend({
    periodType: z.literal("accessedAt").optional().catch(undefined),
    sortType: z
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
    keywords: values(
      keyword.extend({ field: z.enum(["email", "name", "phone"]) }),
    ),
  })
  .transform((search) => canonical(search, "accessedAt"));
export const counselSearchSchema = common
  .pick({
    periodType: true,
    startDateTime: true,
    endDateTime: true,
    keywords: true,
    signupMethods: true,
    accountStatuses: true,
    inquiryType: true,
    statuses: true,
    sortType: true,
    sortDirection: true,
    page: true,
    pageSize: true,
  })
  .extend({
    periodType: z
      .enum(["receivedAt", "answeredAt"])
      .optional()
      .catch(undefined),
    sortType: z
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
    statuses: values(z.enum(["waiting", "reviewing", "completed"])),
  })
  .transform((search) => canonical(search, "receivedAt"));
export const appealSearchSchema = common
  .pick({
    periodType: true,
    startDateTime: true,
    endDateTime: true,
    keywords: true,
    restrictions: true,
    statuses: true,
    results: true,
    sortType: true,
    sortDirection: true,
    page: true,
    pageSize: true,
  })
  .extend({
    periodType: z.enum(["appliedAt", "flaggedAt"]).optional().catch(undefined),
    sortType: z
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
    keywords: values(
      keyword.extend({ field: z.enum(["email", "name", "phone"]) }),
    ),
  })
  .transform((search) => canonical(search, "appliedAt"));
