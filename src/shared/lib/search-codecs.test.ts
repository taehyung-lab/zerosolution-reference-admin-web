import { expect, it } from "vitest";
import { z } from "zod";
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArray,
  recoverArrayItems,
} from "./search-codecs";

it("keeps item recovery distinct from whole-array recovery", () => {
  const item = z.enum(["open", "closed"]);
  expect(recoverArrayItems(item).parse(["open", "bad", "closed"])).toEqual([
    "open",
    "closed",
  ]);
  expect(recoverArray(item).parse(["open", "bad", "closed"])).toBeUndefined();
  for (const codec of [recoverArray(item), recoverArrayItems(item)]) {
    expect(codec.parse("open")).toBeUndefined();
    expect(codec.parse(undefined)).toBeUndefined();
    expect(codec.parse([])).toEqual([]);
    expect(codec.parse(["closed"])).toEqual(["closed"]);
  }
});

it("recovers invalid pages and instants without supplying product defaults", () => {
  for (const value of [undefined, 0, -1, 1.5, "bad"])
    expect(optionalPositiveInteger.parse(value)).toBeUndefined();
  expect(optionalPositiveInteger.parse("2")).toBe(2);
  expect(optionalInstant.parse("2026-09-07T00:00:00Z")).toBe(
    "2026-09-07T00:00:00Z",
  );
  for (const value of [undefined, "2026-09-07", "bad"])
    expect(optionalInstant.parse(value)).toBeUndefined();
});
