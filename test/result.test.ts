import { describe, it, expect } from "vitest";
import { ok, err, errVariant, isOk, isErr, isVariant, fromThrowable, allErrors, toOption, variant } from "../src/index";

describe("result", () => {
  it("ok(1) deep-equals { tag: 'ok', ok: 1 }", () => {
    expect(ok(1)).toEqual({ tag: "ok", ok: 1 });
  });

  it("err(payload) wraps the payload as-is, no tagging imposed", () => {
    expect(err("boom")).toEqual({ tag: "error", error: "boom" });
    expect(err({ parse: { input: "x" } })).toEqual({
      tag: "error",
      error: { parse: { input: "x" } }, // note: not tagged, unlike errVariant below
    });
  });

  it("errVariant({ parse: { input } }) deep-equals nested structure", () => {
    expect(errVariant({ parse: { input: "x" } })).toEqual({
      tag: "error",
      error: { tag: "parse", parse: { input: "x" } },
    });
  });

  it("errVariant({ timeout: null }) deep-equals unit-tagged error", () => {
    expect(errVariant({ timeout: null })).toEqual({
      tag: "error",
      error: { tag: "timeout", timeout: null },
    });
  });

  it("isOk and isErr", () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(ok(1))).toBe(false);
  });

  it("fromThrowable success and mapped error", () => {
    expect(fromThrowable(() => 1)).toEqual({ tag: "ok", ok: 1 });
    const r = fromThrowable(
      () => { throw new Error("x"); },
      (e) => variant({ mapped: String(e) }),
    );
    expect(r).toEqual({ tag: "error", error: { tag: "mapped", mapped: "Error: x" } });
  });

  it("allErrors collects all ok payloads", () => {
    expect(allErrors([ok(1), ok(2)])).toEqual({ tag: "ok", ok: [1, 2] });
  });

  it("allErrors collects all error payloads", () => {
    const result = allErrors([ok(1), errVariant({ a: null }), errVariant({ b: null })]);
    expect(result).toEqual({
      tag: "error",
      error: [
        { tag: "a", a: null },
        { tag: "b", b: null },
      ],
    });
  });

  it("toOption converts correctly", () => {
    expect(toOption(ok(1))).toEqual({ tag: "some", some: 1 });
    expect(toOption(errVariant({ e: null }))).toEqual({ tag: "none", none: null });
  });

  it("early-return sequences Result steps without a fluent helper", () => {
    function checkout(input: string) {
      const parsed = input.length > 0 ? ok(input.length) : errVariant({ empty: null });
      if (isVariant(parsed, "error")) return parsed;
      const doubled = parsed.ok > 10 ? errVariant({ too_long: null }) : ok(parsed.ok * 2);
      if (isVariant(doubled, "error")) return doubled;
      return ok(doubled.ok);
    }

    expect(checkout("")).toEqual({ tag: "error", error: { tag: "empty", empty: null } });
    expect(checkout("hi")).toEqual({ tag: "ok", ok: 4 });
    expect(checkout("this is way too long")).toEqual({
      tag: "error",
      error: { tag: "too_long", too_long: null },
    });
  });
});
