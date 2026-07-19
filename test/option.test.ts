import { describe, it, expect } from "vitest";
import { present, none, isPresent, isNone, presentOr } from "../src/index";

describe("option", () => {
  it("present and none deep-equal expected shapes", () => {
    expect(present("x")).toEqual({ tag: "present", present: "x" });
    expect(none()).toEqual({ tag: "none", none: undefined });
  });

  it("isPresent and isNone", () => {
    expect(isPresent(present(1))).toBe(true);
    expect(isNone(none())).toBe(true);
  });

  it("presentOr converts Option to Result", () => {
    expect(presentOr(present(1), "missing")).toEqual({ tag: "present", present: 1 });
    expect(presentOr(none(), "missing")).toEqual({ tag: "error", error: "missing" });
  });
});
