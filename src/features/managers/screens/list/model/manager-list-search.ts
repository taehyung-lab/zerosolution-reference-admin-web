import { type ManagerListSearch } from "../../../model/manager-list-search";
/**
 * 제품 운영자 목록의 URL 필드·정렬과 필터 부분 추출을 정의한다.
 * 제품 route가 사용하는 단일 검색 계약이다. 기존 리허설 API용 search-schema와의 서버 enum 대응은 미확정이다.
 */
import { compactSearchValues } from "@/shared/lib/compact-search-values";
import { z } from "zod";

const states = [
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
export const managerListSearchSchema = z
  .object({
    periodType: z
      .enum(["joinedAt", "lastAccessAt"])
      .optional()
      .catch(undefined),
    keywords: z
      .array(
        z.object({
          field: z.enum(["id", "name", "phone", "email"]),
          value: z.string().min(1),
        }),
      )
      .optional()
      .catch(undefined),
    types: z.array(z.string()).optional().catch(undefined),
    permission: z.string().optional().catch(undefined),
    statuses: z.array(z.enum(states)).optional().catch(undefined),
    registrationRoutes: z
      .array(z.enum(["WEB", "APP"]))
      .optional()
      .catch(undefined),
    startDateTime: z.iso.datetime().optional().catch(undefined),
    endDateTime: z.iso.datetime().optional().catch(undefined),
    sort: z.enum(managerListSorts).optional().catch(undefined),
    direction: z.enum(["asc", "desc"]).optional().catch(undefined),
    page: z.coerce.number().int().positive().optional().catch(undefined),
    pageSize: z
      .enum(["100", "200", "300", "400", "500", "700", "1000"])
      .or(
        z
          .number()
          .refine((value) =>
            [100, 200, 300, 400, 500, 700, 1000].includes(value),
          ),
      )
      .transform(Number)
      .optional()
      .catch(undefined),
  })
  .transform((value) => {
    if (
      value.startDateTime &&
      value.endDateTime &&
      value.startDateTime > value.endDateTime
    ) {
      value.startDateTime = undefined;
      value.endDateTime = undefined;
    }
    return compactSearchValues(value);
  });
export type ManagerListSort = (typeof managerListSorts)[number];

/** 보기 수의 기본값은 URL에 넣지 않고 여기서만 적용한다. 요청·건수 계산·보기 컨트롤이 같은 값을 쓴다. */
export function managerListPageSize(search: ManagerListSearch) {
  return search.pageSize ?? 100;
}

export function managerListFilter(search: ManagerListSearch) {
  return {
    periodType: search.periodType ?? "joinedAt",
    keywords: search.keywords ?? [],
    types: search.types ?? [],
    permission: search.permission ?? "",
    statuses: search.statuses ?? [],
    registrationRoutes: search.registrationRoutes ?? [],
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
  };
}
