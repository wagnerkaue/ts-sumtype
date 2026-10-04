import { describe, it, expect, vi } from "vitest";
import { ok, err, errVariant, tryFlatMap } from "../src/index";

type Field = { key: string; size: number };
const fields: readonly Field[] = [
  { key: "a", size: 1 },
  { key: "b", size: 2 },
  { key: "c", size: 3 },
];
const withoutTwo = (field: Field) => (field.size === 2 ? err("two") : ok([field.size, field.size]));

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
