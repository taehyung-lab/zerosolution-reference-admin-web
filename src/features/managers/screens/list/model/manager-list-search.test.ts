import { expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { managerDirectoryQuery } from "../../../api/directory-queries";
import {
  managerListSearchSchema,
  resolveManagerListSearch,
} from "./manager-list-search";

it("shares one request/cache for omitted and explicit manager defaults without changing the URL gate", async () => {
  const sparse = managerListSearchSchema.parse({ periodType: "joinedAt" });
  const explicit = managerListSearchSchema.parse({
    periodType: "joinedAt",
    page: 1,
    pageSize: 100,
    sort: "joinedAt",
    direction: "desc",
    keywords: [],
    permission: "",
  });
  const a = managerDirectoryQuery("ko", resolveManagerListSearch(sparse));
  const b = managerDirectoryQuery("ko", resolveManagerListSearch(explicit));
  expect(a.queryKey).toEqual(b.queryKey);
  expect(resolveManagerListSearch(sparse)).not.toHaveProperty("searched");
  expect(JSON.stringify(a.queryKey)).not.toContain("searched");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  expect(await client.query(a)).toEqual(await client.query(b));
  expect(client.getQueryCache().getAll()).toHaveLength(1);
  expect(managerListSearchSchema.parse({})).toEqual({});
  expect(sparse).toEqual({ searched: true });
  expect(resolveManagerListSearch({})).toMatchObject({
    periodType: "joinedAt",
    page: 1,
    pageSize: 100,
    sort: "joinedAt",
    direction: "desc",
  });
  expect(
    managerDirectoryQuery(
      "ko",
      resolveManagerListSearch({ ...sparse, page: 2 }),
    ).queryKey,
  ).not.toEqual(a.queryKey);
  client.clear();
});
it("separates explicit intent from valid conditions and rejects false as a veto", () => {
  expect(managerListSearchSchema.parse({ searched: true })).toEqual({
    searched: true,
  });
  expect(managerListSearchSchema.parse({ searched: false, page: 2 })).toEqual({
    searched: true,
    page: 2,
  });
  expect(managerListSearchSchema.parse({ page: "wrong" })).toEqual({});
  expect(managerListSearchSchema.parse({ searched: false })).toEqual({});
  expect(managerListSearchSchema.parse({ page: 1 })).toEqual({
    searched: true,
  });
  const canonical = managerListSearchSchema.parse({ page: 2 });
  expect(managerListSearchSchema.parse(canonical)).toEqual(canonical);
});

it.each([
  { pageSize: [100] },
  { pageSize: true },
  { pageSize: null },
  { pageSize: {} },
  { pageSize: "00100" },
])(
  "does not broaden product page-size input types while sharing the option source: %j",
  ({ pageSize }) => {
    expect(managerListSearchSchema.parse({ pageSize })).toEqual({});
  },
);
