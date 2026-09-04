import { getManagerTypes } from "@/api/generated/endpoints";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  managerSearchDefaults,
  type ManagerSearch,
} from "../list/search-schema";
import {
  managerListQuery,
  managerDetailQuery,
  managerEditDetailQuery,
  managerTypeOptionsQuery,
  toManagerListParams,
} from "./queries";

vi.mock("@/api/generated/endpoints", () => ({
  getManagerTypes: vi.fn(),
}));

describe("toManagerListParams", () => {
  it("sends all typed keywords and omits UI-only and unused values", () => {
    const params = toManagerListParams({
      ...managerSearchDefaults,
      keywords: [
        { keywordType: "ID", keyword: "manager-1" },
        { keywordType: "PHONE", keyword: "010" },
      ],
    });

    expect(params.keywords).toEqual([
      { keywordType: "ID", keyword: "manager-1" },
      { keywordType: "PHONE", keyword: "010" },
    ]);
    expect(params).not.toHaveProperty("timezone");
  });

  it("omits empty array filters according to the OpenAPI contract", () => {
    const params = toManagerListParams(managerSearchDefaults);

    expect(params).not.toHaveProperty("keywords");
    expect(params).not.toHaveProperty("types");
    expect(params).not.toHaveProperty("statuses");
  });

  it("uses the request params as the list query-key payload", () => {
    const initial = managerListQuery("ko", managerSearchDefaults).queryKey;
    const search: ManagerSearch = {
      ...managerSearchDefaults,
      types: ["AGENCY"],
    };
    const applied = managerListQuery("ko", search).queryKey;

    expect(applied).not.toEqual(initial);
    expect(applied.at(-1)).toEqual(toManagerListParams(search));
  });

  it("passes server enum vocabulary through to the request contract", () => {
    expect(
      toManagerListParams({
        ...managerSearchDefaults,
        periodType: "UPDATED_AT",
        types: ["AGENCY"],
        statuses: ["ACTIVE"],
        registrationRouteTypes: ["APP"],
        sortType: "CREATED_AT",
        sortDirection: "DESC",
      }),
    ).toMatchObject({
      periodType: "UPDATED_AT",
      types: ["AGENCY"],
      statuses: ["ACTIVE"],
      registrationRouteTypes: ["APP"],
      sortType: "CREATED_AT",
      sortDirection: "DESC",
    });
  });

  it("isolates manager type options by locale", () => {
    const query = managerTypeOptionsQuery("ja");

    expect(query.queryKey).toEqual(["api", "ja", "managers", "type-options"]);
    expect(query.staleTime).toBe(Infinity);
    expect(query.meta?.progress).toBe("inline");
  });

  it("keeps the server option response raw in the query cache", async () => {
    const response: Awaited<ReturnType<typeof getManagerTypes>> = [
      { id: "INTERNAL", name: "내부담당자" },
      { name: "식별자 없음" },
    ];
    vi.mocked(getManagerTypes).mockResolvedValue(response);
    const client = new QueryClient();
    const query = managerTypeOptionsQuery("ko");

    await client.query(query);

    expect(client.getQueryData(query.queryKey)).toEqual(response);
  });

  it("marks detail and edit loads as blocking screen-entry queries", () => {
    expect(managerDetailQuery("ko", "manager-1").meta?.progress).toBe(
      "blocking",
    );
    expect(managerEditDetailQuery("ko", "manager-1").meta?.progress).toBe(
      "blocking",
    );
  });
});
