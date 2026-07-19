import { describe, it, expect } from "vitest";
import { present, err, isPresent, isErr, isVariant, fromThrowable, allErrors, toOption, variant, chain } from "../src/index";

describe("result", () => {
  it("present(1) deep-equals { tag: 'present', present: 1 }", () => {
    expect(present(1)).toEqual({ tag: "present", present: 1 });
  });

  it("err('parse', { input }) deep-equals nested structure", () => {
    expect(err("parse", { input: "x" })).toEqual({
      tag: "error",
      error: { tag: "parse", parse: { input: "x" } },
    });
  });

  it("err('timeout') deep-equals unit-tagged error", () => {
    expect(err("timeout")).toEqual({
      tag: "error",
      error: { tag: "timeout", timeout: undefined },
    });
  });

  it("isPresent and isErr", () => {
    expect(isPresent(present(1))).toBe(true);
    expect(isErr(present(1))).toBe(false);
  });

  it("fromThrowable success and mapped error", () => {
    expect(fromThrowable(() => 1)).toEqual({ tag: "present", present: 1 });
    const r = fromThrowable(
      () => { throw new Error("x"); },
      (e) => variant("mapped", String(e)),
    );
    expect(r).toEqual({ tag: "error", error: { tag: "mapped", mapped: "Error: x" } });
  });

  it("allErrors collects all present payloads", () => {
    expect(allErrors([present(1), present(2)])).toEqual({ tag: "present", present: [1, 2] });
  });

  it("allErrors collects all error payloads", () => {
    const result = allErrors([present(1), err("a"), err("b")]);
    expect(result).toEqual({
      tag: "error",
      error: [
        { tag: "a", a: undefined },
        { tag: "b", b: undefined },
      ],
    });
  });

  it("toOption converts correctly", () => {
    expect(toOption(present(1))).toEqual({ tag: "present", present: 1 });
    expect(toOption(err("e"))).toEqual({ tag: "none", none: undefined });
  });

  it("early-return and chain equivalence", () => {
    function withEarlyReturn(input: string) {
      const parsed = input.length > 0 ? present(input.length) : err("empty");
      if (isVariant(parsed, "error")) return parsed;
      const doubled = parsed.present > 10 ? err("too_long") : present(parsed.present * 2);
      if (isVariant(doubled, "error")) return doubled;
      return present(doubled.present);
    }

    function withChain(input: string) {
      return chain(present(input))
        .andThen((s) => s.length > 0 ? present(s.length) : err("empty"))
        .andThen((n) => n > 10 ? err("too_long") : present(n * 2))
        .done();
    }

    for (const input of ["", "hi", "this is way too long"]) {
      expect(withChain(input)).toEqual(withEarlyReturn(input));
    }
  });
});
