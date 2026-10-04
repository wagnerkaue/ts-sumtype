import { describe, it, expect, vi } from "vitest";
import { ok, err, errVariant, tryReduce, tryMap, tryFlatMap } from "../src/index";

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
    expect(tryReduce((sum: number, field: Field) => ok(sum + field.size), 10, "field")(fields)).toEqual(ok(16));
  });

  it("locates the first failing item at its index, or at at(item)", () => {
    expect(tryReduce(add, 0, "field")(fields)).toEqual(errVariant("field", { at: 1, error: "two" }));
    expect(tryReduce(add, 0, "field", (field) => field.key)(fields)).toEqual(
      errVariant("field", { at: "b", error: "two" }),
    );
  });
});

describe("tryMap", () => {
  const sizeOf = (field: Field) => (field.size === 2 ? err("two") : ok(field.size * 10));

  it("collects what each item returns", () => {
    expect(tryMap((field: Field) => ok(field.key), "field")(fields)).toEqual(ok(["a", "b", "c"]));
  });

  it("locates the first failing item at its index, or at at(item)", () => {
    expect(tryMap(sizeOf, "field")(fields)).toEqual(errVariant("field", { at: 1, error: "two" }));
    expect(tryMap(sizeOf, "field", (field) => field.key)(fields)).toEqual(errVariant("field", { at: "b", error: "two" }));
  });

  it("stops at the first failing item", () => {
    const f = vi.fn(sizeOf);
    tryMap(f, "field")(fields);
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("tryFlatMap", () => {
  it("concatenates what each item returns", () => {
    expect(tryFlatMap((field: Field) => ok([field.key]), "field")(fields)).toEqual(ok(["a", "b", "c"]));
  });

  it("locates the first failing item at its index", () => {
    expect(tryFlatMap(withoutTwo, "field")(fields)).toEqual(errVariant("field", { at: 1, error: "two" }));
  });

  it("locates it at at(item) when given", () => {
    expect(tryFlatMap(withoutTwo, "field", (field) => field.key)(fields)).toEqual(
      errVariant("field", { at: "b", error: "two" }),
    );
  });

  it("stops at the first failing item", () => {
    const f = vi.fn(withoutTwo);
    tryFlatMap(f, "field")(fields);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
