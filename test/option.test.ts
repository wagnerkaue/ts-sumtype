import { describe, it, expect } from "vitest";
import { some, none, isSome, isNone, someOr } from "../src/index";

describe("option", () => {
  it("some and none deep-equal expected shapes", () => {
    expect(some("x")).toEqual({ tag: "some", some: "x" });
    expect(none()).toEqual({ tag: "none", none: null });
  });

  it("isSome and isNone", () => {
    expect(isSome(some(1))).toBe(true);
    expect(isNone(none())).toBe(true);
  });

  it("someOr converts Option to Result", () => {
    expect(someOr(some(1), "missing")).toEqual({ tag: "ok", ok: 1 });
    expect(someOr(none(), "missing")).toEqual({ tag: "error", error: "missing" });
  });
});
