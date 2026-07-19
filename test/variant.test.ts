import { describe, it, expect } from "vitest";
import { variant, isVariant, type Variant } from "../src/index";

describe("isVariant", () => {
  type ABC = Variant<"a", number> | Variant<"b", string> | Variant<"c">;
  const a = variant("a", 1) as ABC;
  const b = variant("b", "two") as ABC;
  const c = variant("c") as ABC;

  it("matches a single tag", () => {
    expect(isVariant(a, "a")).toBe(true);
    expect(isVariant(a, "b")).toBe(false);
  });

  it("matches any of several tags (OR)", () => {
    expect(isVariant(a, "a", "b")).toBe(true);
    expect(isVariant(b, "a", "b")).toBe(true);
  });

  it("with no tags matches nothing", () => {
    expect(isVariant(a)).toBe(false);
  });

  it("narrows in the positive branch", () => {
    const u = a as typeof a | typeof b | typeof c;
    if (isVariant(u, "a", "b")) {
      // u is now Variant<"a", number> | Variant<"b", string>
      const payload: number | string = isVariant(u, "a") ? u.a : u.b;
      expect(payload).toBe(1);
    } else {
      throw new Error("expected positive branch");
    }
  });

  it("narrows the else / early-return branch to the complement", () => {
    function firstNonError(u: typeof a | typeof b | typeof c) {
      if (!isVariant(u, "a", "b")) {
        // u is narrowed to Variant<"c", undefined> here
        const payload: undefined = u.c;
        return payload;
      }
      return u.tag;
    }
    expect(firstNonError(c)).toBeUndefined();
    expect(firstNonError(a)).toBe("a");
  });
});
