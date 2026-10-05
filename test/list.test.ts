import { describe, it, expect, vi } from "vitest";
import { ok, err, tryReduce, tryMap, tryFlatMap } from "../src/index";

type Field = { key: string; size: number };
const fields: readonly Field[] = [
  { key: "a", size: 1 },
  { key: "b", size: 2 },
  { key: "c", size: 3 },
];
const withoutTwo = (field: Field) => (field.size === 2 ? err("two") : ok([field.size, field.size]));

describe("tryReduce", () => {
  const add = (sum: number, field: Field) => (field.size === 2 ? err("two") : ok(sum + field.size));

  it("folds every item from the initial value", () => {
    expect(tryReduce(fields, (sum, field) => ok(sum + field.size), 10)).toEqual(ok(16));
  });

  it("locates the first failing item at its index, or at at(item)", () => {
    expect(tryReduce(fields, add, 0)).toEqual(err({ at: 1, error: "two" }));
    expect(tryReduce(fields, add, 0, (field) => field.key)).toEqual(err({ at: "b", error: "two" }));
  });
});

describe("tryMap", () => {
  const sizeOf = (field: Field) => (field.size === 2 ? err("two") : ok(field.size * 10));

  it("collects what each item returns", () => {
    expect(tryMap(fields, (field) => ok(field.key))).toEqual(ok(["a", "b", "c"]));
  });

  it("locates the first failing item at its index, or at at(item)", () => {
    expect(tryMap(fields, sizeOf)).toEqual(err({ at: 1, error: "two" }));
    expect(tryMap(fields, sizeOf, (field) => field.key)).toEqual(err({ at: "b", error: "two" }));
  });

  it("stops at the first failing item", () => {
    const f = vi.fn(sizeOf);
    tryMap(fields, f);
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("tryFlatMap", () => {
  it("concatenates what each item returns", () => {
    expect(tryFlatMap(fields, (field) => ok([field.key]))).toEqual(ok(["a", "b", "c"]));
  });

  it("locates the first failing item at its index, or at at(item)", () => {
    expect(tryFlatMap(fields, withoutTwo)).toEqual(err({ at: 1, error: "two" }));
    expect(tryFlatMap(fields, withoutTwo, (field) => field.key)).toEqual(err({ at: "b", error: "two" }));
  });

  it("stops at the first failing item", () => {
    const f = vi.fn(withoutTwo);
    tryFlatMap(fields, f);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
