import { defineSearchFields } from "@/shared/lib/search-fields";
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArray,
} from "@/shared/lib/search-codecs";
import { standardPageSizeOptions } from "@/shared/model/list-options";
import {
  normalizeClosedInstantRange,
  omitSearchDefaults,
  resolveSearchDefaults,
} from "@/shared/lib/search";
import { z } from "zod";

export const performancePeriodTypes = [
  "performedAt",
  "registeredAt",
  "updatedAt",
] as const;
export const performanceKeywordFields = [
  "title",
  "performers",
  "organizer",
] as const;
export const performanceSortTypes = [
  "registeredAt",
  "updatedAt",
  "period",
  "ticketKind",
  "performanceType",
  "title",
  "performers",
  "organizer",
] as const;
const defaultPerformancePeriodType = "performedAt";
const values = recoverArray(z.string().min(1));
export const performanceSearchFields = {
  periodType: {
    schema: z.enum(performancePeriodTypes).optional().catch(undefined),
    defaultValue: defaultPerformancePeriodType,
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
    schema: recoverArray(
      z.object({
        field: z.enum(performanceKeywordFields),
        value: z.string().trim().min(1),
      }),
    ),
    defaultValue: [],
    kind: "filter",
  },
  ticketKinds: { schema: values, defaultValue: [], kind: "filter" },
  performanceTypes: { schema: values, defaultValue: [], kind: "filter" },
  sellers: { schema: values, defaultValue: [], kind: "filter" },
  venueId: {
    schema: z.string().min(1).optional().catch(undefined),
    defaultValue: undefined,
    kind: "filter",
  },
  sortType: {
    schema: z.enum(performanceSortTypes).optional().catch(undefined),
    defaultValue: "registeredAt",
    kind: "view",
  },
  // 방향 기본값 desc: 원문이 적지 않아 2026-09-11 사용자 확정(판정 문서 질문 3, 목록 공통).
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
export const performanceSearchContract = defineSearchFields(
  performanceSearchFields,
);
export const performanceSearchDefaults = performanceSearchContract.defaults;
export const performanceSearchPartition = performanceSearchContract.partition;

export const performanceSearchSchema = performanceSearchContract.schema.transform(
  (fields) =>
    omitSearchDefaults(
      normalizeClosedInstantRange(fields),
      performanceSearchDefaults,
    ),
);
export type PerformanceRouteSearch = z.output<typeof performanceSearchSchema>;

export function resolvePerformanceSearch(search: PerformanceRouteSearch) {
  return resolveSearchDefaults<
    PerformanceRouteSearch,
    typeof performanceSearchDefaults
  >(search, performanceSearchDefaults);
}
export type ResolvedPerformanceSearch = ReturnType<
  typeof resolvePerformanceSearch
>;
