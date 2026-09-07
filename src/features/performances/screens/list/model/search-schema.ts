import { standardPageSizeOptions } from "@/shared/config/list";
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import { resolveSearchDefaults } from "@/shared/lib/search";
import type { SearchFieldPartition } from "@/shared/lib/search-partition";
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
const values = z.array(z.string().min(1)).optional().catch(undefined);
export const performanceSearchSchema = z
  .object({
    searched: z.literal(false).optional().catch(undefined),
    periodType: z.enum(performancePeriodTypes).optional().catch(undefined),
    startDateTime: z.iso.datetime().optional().catch(undefined),
    endDateTime: z.iso.datetime().optional().catch(undefined),
    keywords: z
      .array(
        z.object({
          field: z.enum(performanceKeywordFields),
          value: z.string().trim().min(1),
        }),
      )
      .optional()
      .catch(undefined),
    ticketKinds: values,
    performanceTypes: values,
    sellers: values,
    venueId: z.string().min(1).optional().catch(undefined),
    sortType: z.enum(performanceSortTypes).optional().catch(undefined),
    sortDirection: z.enum(["asc", "desc"]).optional().catch(undefined),
    page: z.coerce.number().int().positive().optional().catch(undefined),
    pageSize: z.coerce
      .number()
      .pipe(z.union(standardPageSizeOptions.map((size) => z.literal(size))))
      .optional()
      .catch(undefined),
  })
  .transform((search) => {
    const next = compactSearchValues(search);
    if (
      next.startDateTime &&
      next.endDateTime &&
      Date.parse(next.startDateTime) > Date.parse(next.endDateTime)
    ) {
      delete next.startDateTime;
      delete next.endDateTime;
    }
    if (next.periodType === defaultPerformancePeriodType)
      delete next.periodType;
    if (next.page === 1) delete next.page;
    if (next.pageSize === 100) delete next.pageSize;
    if (next.sortType === "registeredAt") delete next.sortType;
    return next;
  });
export type PerformanceRouteSearch = z.output<typeof performanceSearchSchema>;
export const performanceSearchPartition = {
  searched: "filter",
  periodType: "filter",
  startDateTime: "filter",
  endDateTime: "filter",
  keywords: "filter",
  ticketKinds: "filter",
  performanceTypes: "filter",
  sellers: "filter",
  venueId: "filter",
  sortType: "view",
  sortDirection: "view",
  page: "view",
  pageSize: "view",
} as const satisfies SearchFieldPartition<PerformanceRouteSearch>;
export const performanceSearchDefaults = {
  searched: undefined as PerformanceRouteSearch["searched"],
  periodType: defaultPerformancePeriodType,
  startDateTime: undefined as string | undefined,
  endDateTime: undefined as string | undefined,
  keywords: [],
  ticketKinds: [],
  performanceTypes: [],
  sellers: [],
  venueId: undefined as string | undefined,
  sortType: "registeredAt",
  sortDirection: undefined as PerformanceRouteSearch["sortDirection"],
  page: 1,
  pageSize: 100,
} as const satisfies Readonly<Record<keyof PerformanceRouteSearch, unknown>> &
  Partial<PerformanceRouteSearch>;

export function resolvePerformanceSearch(search: PerformanceRouteSearch) {
  return resolveSearchDefaults(search, performanceSearchDefaults);
}
