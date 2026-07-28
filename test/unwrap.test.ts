import { describe, it, expect } from "vitest";
import { ok, some, err, errVariant, none, unwrap, unwrapOr, expect as expectFn, fromNullable, all, type Result } from "../src/index";

describe("unwrap", () => {
  it("unwrap", () => {
    expect(unwrap(ok(5))).toBe(5);
    expect(unwrap(some(5))).toBe(5);
    expect(() => unwrap(errVariant({ boom: null }))).toThrow();
    expect(() => unwrap(none())).toThrow();
  });

  it("unwrapOr", () => {
    expect(unwrapOr(err("bad") as Result<number, string>, 0)).toBe(0);
    expect(unwrapOr(none<number>(), 0)).toBe(0);
  });

  it("expect", () => {
    expect(expectFn(ok(1), "msg")).toBe(1);
    expect(expectFn(some(1), "msg")).toBe(1);
    expect(() => expectFn(none(), "custom")).toThrow("custom");
  });

  it("fromNullable one-arg → Option", () => {
    expect(fromNullable("x")).toEqual({ tag: "some", some: "x" });
    expect(fromNullable(null)).toEqual({ tag: "none", none: null });
  });

  it("fromNullable two-arg → Result", () => {
    expect(fromNullable("x", "err")).toEqual({ tag: "ok", ok: "x" });
    expect(fromNullable(null, "err")).toEqual({ tag: "error", error: "err" });
  });

  it("all over Results short-circuits on first error", () => {
    expect(all([ok(1), ok(2)])).toEqual({ tag: "ok", ok: [1, 2] });
    const r = all([ok(1), errVariant({ bad: null })]);
    expect(r.tag).toBe("error");
  });

  it("all([]) returns ok with empty array", () => {
    expect(all([])).toEqual({ tag: "ok", ok: [] });
  });

  it("all over an Option array short-circuits on none", () => {
    expect(all([some(1), some(2)])).toEqual({ tag: "some", some: [1, 2] });
    expect(all([some(1), none()])).toEqual({ tag: "none", none: null });
  });
});
