import { getList8 } from "@/api/generated/endpoints";
import { handlers } from "@/api/mocks/handlers";
import {
  managerAgencyOptionsQuery,
  managerDetailQuery,
  managerEditDetailQuery,
  managerListQuery,
  managerPermissionOptionsQuery,
  managerTypeOptionsQuery,
} from "@/features/managers/api/queries";
import { managerSearchDefaults } from "@/features/managers/fixtures/manager-search";
import { server } from "@/test/msw/server";
import { QueryClient } from "@tanstack/react-query";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => server.use(...handlers));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("generated API with shared HTTP mocks", () => {
  it("connects list, detail, edit and dependent options through the actual query options", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    try {
      const list = await client.query(
        managerListQuery("ko", managerSearchDefaults),
      );
      expect(list.totalCount).toBe(2);
      const id = list.list?.[0]?.id;
      expect(id).toBe("mock-manager-2");
      const detail = await client.query(managerDetailQuery("ko", id!));
      const edit = await client.query(managerEditDetailQuery("ko", id!));
      expect(detail.id).toBe(edit.id);
      expect(detail.phone).toBe("010-****-0002");
      expect(edit.phone).toBe("010-0000-0002");
      const types = await client.query(managerTypeOptionsQuery("ko"));
      const agencies = await client.query(managerAgencyOptionsQuery("ko"));
      const permissions = await client.query(
        managerPermissionOptionsQuery("ko", "AGENCY"),
      );
      expect(types.some((type) => type.id === edit.type?.id)).toBe(true);
      expect(agencies.some((agency) => agency.id === edit.agency?.id)).toBe(
        true,
      );
      expect(permissions.map((permission) => permission.id)).toEqual([
        edit.permission?.id,
      ]);
    } finally {
      client.clear();
    }
  });

  it("filters, sorts and paginates the same records, including an empty result", async () => {
    const page = await getList8({
      sortType: "ID",
      sortDirection: "ASC",
      pageNo: 2,
      pageSize: 1,
    });
    expect(page).toMatchObject({
      pageNo: 2,
      pageSize: 1,
      totalCount: 2,
      list: [{ id: "mock-manager-2" }],
    });
    const filtered = await getList8({ types: ["INTERNAL"] });
    expect(filtered.list?.map((row) => row.id)).toEqual(["mock-manager-1"]);
    const empty = await getList8({ statuses: ["INACTIVE"] });
    expect(empty).toMatchObject({ totalCount: 0, list: [] });
  });

  it("does not turn an unknown record into an empty successful detail", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    try {
      await expect(
        client.query(managerDetailQuery("ko", "missing")),
      ).rejects.toMatchObject({ kind: "not-found" });
    } finally {
      client.clear();
    }
  });

  it("reports unsupported query behavior instead of returning misleading results", async () => {
    await expect(getList8({ agencyIds: [1] })).rejects.toMatchObject({
      status: 501,
    });
    await expect(getList8({ pageSize: 0 })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("returns an explicit mock failure for an unimplemented write", async () => {
    const response = await fetch("http://localhost:3000/api/v1/managers", {
      method: "POST",
    });
    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({ code: "MOCK_NOT_IMPLEMENTED" });
  });
});
