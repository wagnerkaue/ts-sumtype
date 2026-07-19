import { describe, it, expect } from "vitest";
import { present, err, none, variant, unwrap, unwrapOr, expect as expectFn, fromNullable, all, type Result } from "../src/index";

describe("shared", () => {
  it("unwrap", () => {
    expect(unwrap(present(5))).toBe(5);
    expect(() => unwrap(err("boom"))).toThrow();
    expect(() => unwrap(none())).toThrow();
  });

  it("unwrapOr", () => {
    expect(unwrapOr(variant("error", "bad") as Result<number, string>, 0)).toBe(0);
    expect(unwrapOr(none<number>(), 0)).toBe(0);
  });

  it("expect", () => {
    expect(expectFn(present(1), "msg")).toBe(1);
    expect(() => expectFn(none(), "custom")).toThrow("custom");
  });

  it("fromNullable one-arg → Option", () => {
    expect(fromNullable("x")).toEqual({ tag: "present", present: "x" });
    expect(fromNullable(null)).toEqual({ tag: "none", none: undefined });
  });

  it("fromNullable two-arg → Result", () => {
    expect(fromNullable("x", "err")).toEqual({ tag: "present", present: "x" });
    expect(fromNullable(null, "err")).toEqual({ tag: "error", error: "err" });
  });

  it("all short-circuits on first error", () => {
    expect(all([present(1), present(2)])).toEqual({ tag: "present", present: [1, 2] });
    const r = all([present(1), err("bad")]);
    expect(r.tag).toBe("error");
  });

  it("all([]) returns present with empty array", () => {
    expect(all([])).toEqual({ tag: "present", present: [] });
  });

  it("all over an Option array short-circuits on none", () => {
    expect(all([present(1), present(2)])).toEqual({ tag: "present", present: [1, 2] });
    expect(all([present(1), none()])).toEqual({ tag: "none", none: undefined });
  });
});
