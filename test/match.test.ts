import { describe, it, expect, vi } from "vitest";
import { variant, matchTag } from "../src/index";

describe("matchTag", () => {
  it("inherited key 'toString' falls through to fallback", () => {
    expect(matchTag({ tag: "toString", toString: 42 }, { other: () => "o" }, () => "fb")).toBe("fb");
  });

  it("inherited key 'constructor' falls through to fallback", () => {
    expect(matchTag({ tag: "constructor" }, { other: 1 }, "fb")).toBe("fb");
  });

  it("function arm receives payload", () => {
    expect(matchTag(variant({ nav: { path: "/a" } }), { nav: (p: { path: string }) => p.path }, "fb")).toBe("/a");
  });

  it("unit variant handler receives null", () => {
    const handler = vi.fn(() => "handled");
    matchTag(variant({ idle: null }), { idle: handler });
    expect(handler).toHaveBeenCalledWith(null);
  });

  it("value arm is returned by reference; nested function is not invoked", () => {
    const fn = vi.fn();
    const arm = { nested: fn };
    const result = matchTag(variant({ x: 1 }), { x: arm });
    expect(result).toBe(arm);
    expect(fn).not.toHaveBeenCalled();
  });

  it("arm explicitly set to undefined returns undefined; fallback not called", () => {
    const fallbackFn = vi.fn(() => "fallback");
    const result = matchTag({ tag: "nav", nav: 1 }, { nav: undefined }, fallbackFn);
    expect(result).toBeUndefined();
    expect(fallbackFn).not.toHaveBeenCalled();
  });

  it("function fallback receives the whole variant", () => {
    const result = matchTag({ tag: "idle" }, { nav: () => "n" }, (rest) => rest.tag);
    expect(result).toBe("idle");
  });

  it("variant round-trips through JSON, payload key included even when empty", () => {
    const r = variant({ ok: 1 });
    expect(JSON.parse(JSON.stringify(r))).toEqual({ tag: "ok", ok: 1 });
    const n = variant({ none: null });
    expect(JSON.parse(JSON.stringify(n))).toEqual({ tag: "none", none: null });
  });
});
