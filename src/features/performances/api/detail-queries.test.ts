import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { performanceDetailQuery } from "./queries";

describe("performance detail response boundary", () => {
  it("loads each ID independently without a list cache and isolates locale", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const first = await client.query(
      performanceDetailQuery("ko", "reference-performance-1"),
    );
    const second = await client.query(
      performanceDetailQuery("ko", "reference-performance-2"),
    );
    expect(first.id).toBe("reference-performance-1");
    expect(second.id).toBe("reference-performance-2");
    expect(first.basic.translations.ko.title).toBe("Reference Performance 1");
    expect(first.basic.sessions).toHaveLength(2);
    expect(performanceDetailQuery("ja", first.id).queryKey).not.toEqual(
      performanceDetailQuery("ko", first.id).queryKey,
    );
    client.clear();
  });

  it("rejects a missing fixture ID instead of fabricating an empty detail", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await expect(
      client.query(performanceDetailQuery("ko", "missing")),
    ).rejects.toMatchObject({ kind: "not-found" });
    client.clear();
  });
});
