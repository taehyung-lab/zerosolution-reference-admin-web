import { defineSearchFields } from "@/shared/lib/search-fields";
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArrayItems,
} from "@/shared/lib/search-codecs";
import { type ManagerSearch } from "../../../api/manager-search";
/**
 * 기존 API 운영자 목록의 URL 검증·기본값·필터/보기 상태 구분을 정의한다.
 * 실제 API에서도 이 책임은 필요하나 enum과 검색 필드는 제품용 검색 모델과 대조할 교체 지점이다.
 */
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import {
  normalizeClosedInstantRange,
  omitSearchDefaults,
  resolveSearchDefaults,
} from "@/shared/lib/search";
import { z } from "zod";
import {
  managerPeriodTypes,
  managerRegistrationRouteTypes,
  managerSortDirections,
  managerStatuses,
  managerTypes,
  type ManagerPeriodType,
} from "../../../api/manager-list-contract";
import { managerSortTypes } from "./manager-sort";

const defaultManagerPeriodType: ManagerPeriodType = "CREATED_AT";

export const managerKeywordTypes = [
  "ID",
  "NAME",
  "PHONE",
  "ORGANIZATION",
  "PERMISSION",
] as const;

export const managerSearchFields = {
  keywords: {
    schema: recoverArrayItems(
      z.object({
        keywordType: z.enum(managerKeywordTypes),
        keyword: z.string().min(1),
      }),
    ),
    defaultValue: [],
    kind: "filter",
  },
  periodType: {
    schema: z.enum(managerPeriodTypes).optional().catch(undefined),
    defaultValue: defaultManagerPeriodType,
    kind: "filter",
  },
  types: {
    schema: recoverArrayItems(z.enum(managerTypes)),
    defaultValue: [],
    kind: "filter",
  },
  statuses: {
    schema: recoverArrayItems(z.enum(managerStatuses)),
    defaultValue: [],
    kind: "filter",
  },
  agencyIds: {
    schema: recoverArrayItems(z.coerce.number()),
    defaultValue: [],
    kind: "filter",
  },
  registrationRouteTypes: {
    schema: recoverArrayItems(z.enum(managerRegistrationRouteTypes)),
    defaultValue: [],
    kind: "filter",
  },
  sortType: {
    schema: z.enum(managerSortTypes).optional().catch(undefined),
    defaultValue: "CREATED_AT",
    kind: "view",
  },
  sortDirection: {
    schema: z.enum(managerSortDirections).optional().catch(undefined),
    defaultValue: "DESC",
    kind: "view",
  },
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: "view" },
  pageSize: {
    schema: optionalPositiveInteger,
    defaultValue: 100,
    kind: "view",
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
} as const;
export const managerSearchContract = defineSearchFields(managerSearchFields);
export const managerSearchDefaults = managerSearchContract.defaults;
export const managerSearchPartition = managerSearchContract.partition;

export const managerSearchSchema = managerSearchContract.schema.extend({
  searched: z.literal(true).optional().catch(undefined),
});

export type ManagerRouteSearch = z.output<typeof managerSearchSchema>;

export const managerCanonicalSearchSchema = managerSearchSchema.transform(
  ({ searched, ...fields }): ManagerRouteSearch => {
    const valid = compactSearchValues(normalizeClosedInstantRange(fields));
    if (searched !== true && Object.keys(valid).length === 0) return {};
    return {
      ...omitSearchDefaults(valid, managerSearchDefaults),
      searched: true,
    };
  },
);

export type ManagerRouteSearchInput = z.output<typeof managerSearchSchema>;

export function resolveManagerSearch(
  search: ManagerRouteSearch,
): ManagerSearch {
  return resolveSearchDefaults<
    Omit<ManagerRouteSearch, "searched">,
    typeof managerSearchDefaults
  >(search, managerSearchDefaults);
}

export function toManagerRouteSearch(
  search: ManagerSearch,
): ManagerRouteSearch {
  return managerCanonicalSearchSchema.parse({ ...search, searched: true });
}
