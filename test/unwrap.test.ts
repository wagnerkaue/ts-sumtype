import { describe, it, expect } from "vitest";
import { ok, some, err, errVariant, none, someOr, unwrap, unwrapOr, expect as expectFn, fromNullable, all, type Result } from "../src/index";

describe("unwrap", () => {
  it("unwrap", () => {
    expect(unwrap(ok(5))).toBe(5);
    expect(() => unwrap(errVariant("boom", null))).toThrow();
  });

  it("unwrap reports the error payload it threw on", () => {
    expect(() => unwrap(err("declined") as Result<number, string>)).toThrow("declined");
  });

  it("unwrapOr", () => {
    expect(unwrapOr(err("bad") as Result<number, string>, 0)).toBe(0);
  });

  it("expect", () => {
    expect(expectFn(ok(1), "msg")).toBe(1);
    expect(() => expectFn(err("bad") as Result<number, string>, "custom")).toThrow("custom");
  });

  it("an Option reaches unwrap through someOr, which supplies the reason", () => {
    expect(unwrap(someOr(some(5), "missing"))).toBe(5);
    expect(() => unwrap(someOr(none<number>(), "missing"))).toThrow("missing");
  });

  it("fromNullable one-arg → Option", () => {
    expect(fromNullable("x")).toEqual({ tag: "some", some: "x" });
    expect(fromNullable(null)).toEqual({ tag: "none", none: null });
  });

  it("fromNullable two-arg → Result", () => {
    expect(fromNullable("x", "err")).toEqual({ tag: "ok", ok: "x" });
    expect(fromNullable(null, "err")).toEqual({ tag: "error", error: "err" });
  });

  it("all short-circuits on first error", () => {
    expect(all([ok(1), ok(2)])).toEqual({ tag: "ok", ok: [1, 2] });
    const r = all([ok(1), errVariant("bad", null)]);
    expect(r.tag).toBe("error");
  });

  it("all([]) returns Ok<[]>", () => {
    expect(all([])).toEqual({ tag: "ok", ok: [] });
  });

});
