import { standardPageSizeOptions } from "@/shared/model/list-options";
import { defineSearchFields } from "@/shared/lib/search-fields";
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArray,
} from "@/shared/lib/search-codecs";
import {
  normalizeClosedInstantRange,
  omitSearchDefaults,
  resolveSearchDefaults,
} from "@/shared/lib/search";
import { type ManagerListSearch } from "../../../model/manager-list-search";
/**
 * 제품 운영자 목록의 URL 필드·정렬과 필터/view 구분을 정의한다.
 * 제품 route가 사용하는 단일 검색 계약이다. 기존 리허설 API용 search-schema와의 서버 enum 대응은 미확정이다.
 */
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import { z } from "zod";

export const managerListPeriodTypes = ["joinedAt", "lastAccessAt"] as const;
export const managerListKeywordFields = [
  "id",
  "name",
  "phone",
  "email",
] as const;
export const managerListRegistrationRoutes = ["WEB", "APP"] as const;
export const managerListStatuses = [
  "awaiting",
  "rejected",
  "active",
  "inactive",
  "locked",
] as const;
export const managerListSorts = [
  "joinedAt",
  "lastAccessAt",
  "type",
  "organization",
  "id",
  "name",
  "phone",
  "email",
  "permission",
  "registrationRoute",
  "accountStatus",
] as const;

/**
 * 제품의 화면 검색값이다. 기존 API enum을 확장하지 않으며 서버 변환은 별도로 연결한다.
 */
export const managerListSearchFields = {
  periodType: {
    schema: z.enum(managerListPeriodTypes).optional().catch(undefined),
    defaultValue: "joinedAt",
    kind: "filter",
  },
  keywords: {
    schema: recoverArray(
      z.object({
        field: z.enum(managerListKeywordFields),
        value: z.string().min(1),
      }),
    ),
    defaultValue: [],
    kind: "filter",
  },
  types: { schema: recoverArray(z.string()), defaultValue: [], kind: "filter" },
  permission: {
    schema: z.string().min(1).optional().catch(undefined),
    defaultValue: "",
    kind: "filter",
  },
  statuses: {
    schema: recoverArray(z.enum(managerListStatuses)),
    defaultValue: [],
    kind: "filter",
  },
  registrationRoutes: {
    schema: recoverArray(z.enum(managerListRegistrationRoutes)),
    defaultValue: [],
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
  sort: {
    schema: z.enum(managerListSorts).optional().catch(undefined),
    defaultValue: "joinedAt",
    kind: "view",
  },
  direction: {
    schema: z.enum(["asc", "desc"]).optional().catch(undefined),
    defaultValue: "desc",
    kind: "view",
  },
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: "view" },
  pageSize: {
    schema: z
      .enum(standardPageSizeOptions.map(String))
      .or(
        z
          .number()
          .refine((value) =>
            standardPageSizeOptions.some((size) => size === value),
          ),
      )
      .transform(Number)
      .optional()
      .catch(undefined),
    defaultValue: 100,
    kind: "view",
  },
} as const;
export const managerListSearchContract = defineSearchFields(
  managerListSearchFields,
);
export const managerListSearchDefaults = managerListSearchContract.defaults;
export const managerListSearchPartition = managerListSearchContract.partition;
export type ManagerListRouteSearch = ManagerListSearch & {
  readonly searched?: true;
};
export const managerListSearchSchema = managerListSearchContract.schema
  .extend({ searched: z.literal(true).optional().catch(undefined) })
  .transform(({ searched, ...fields }): ManagerListRouteSearch => {
    const valid = compactSearchValues(normalizeClosedInstantRange(fields));
    if (searched !== true && Object.keys(valid).length === 0) return {};
    return {
      ...omitSearchDefaults(valid, managerListSearchDefaults),
      searched: true,
    };
  });
export type ManagerListSort = (typeof managerListSorts)[number];

export function resolveManagerListSearch(search: ManagerListSearch) {
  return resolveSearchDefaults(search, managerListSearchDefaults);
}
export type ResolvedManagerListSearch = ReturnType<
  typeof resolveManagerListSearch
>;
