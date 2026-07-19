import { describe, it, expect, vi } from "vitest";
import { present, err, none, chain } from "../src/index";

describe("chain", () => {
  it("pure-Result chain: success and short-circuit", () => {
    const step2 = vi.fn((n: number) => present(n * 2));

    const success = chain(present(5)).andThen((n) => present(n + 1)).andThen(step2).done();
    expect(success).toEqual({ tag: "present", present: 12 });
    expect(step2).toHaveBeenCalledTimes(1);

    step2.mockClear();
    const fail = chain(present(5)).andThen(() => err("stop")).andThen(step2).done();
    expect(fail.tag).toBe("error");
    expect(step2).not.toHaveBeenCalled();
  });

  it("pure-Option chain: success and short-circuit on none", () => {
    const step2 = vi.fn((n: number) => present(n * 2));

    const success = chain(present(3)).andThen((n) => present(n + 1)).andThen(step2).done();
    expect(success).toEqual({ tag: "present", present: 8 });
    expect(step2).toHaveBeenCalledTimes(1);

    step2.mockClear();
    const fail = chain(present(3)).andThen(() => none<number>()).andThen(step2).done();
    expect(fail.tag).toBe("none");
    expect(step2).not.toHaveBeenCalled();
  });

  it("mixed Result→Result→Option chain short-circuits correctly", () => {
    const step3 = vi.fn((s: string) => present(s.toUpperCase()));

    const success = chain(present("hi"))
      .andThen((s) => present(s.length))
      .andThen((n) => present(n.toString()))
      .andThen(step3)
      .done();
    expect(success).toEqual({ tag: "present", present: "2" });
    expect(step3).toHaveBeenCalledTimes(1);

    step3.mockClear();
    const failAtResult = chain(present("hi"))
      .andThen(() => err("bad"))
      .andThen((n: number) => present(n.toString()))
      .andThen(step3)
      .done();
    expect(failAtResult.tag).toBe("error");
    expect(step3).not.toHaveBeenCalled();

    step3.mockClear();
    const failAtOption = chain(present("hi"))
      .andThen((s) => present(s.length))
      .andThen((n) => present(n.toString()))
      .andThen(() => none<string>())
      .done();
    expect(failAtOption.tag).toBe("none");
  });

  it("map does not treat tag-shaped return values as short-circuit signals", () => {
    const tagShaped = { tag: "present", present: 42 };
    const result = chain(present(1)).map(() => tagShaped).done();
    expect(result).toEqual({ tag: "present", present: tagShaped });
  });

  it("chain seeds from a present value, a Result, and an Option", () => {
    expect(chain(present(10)).map((n) => n + 1).done()).toEqual({ tag: "present", present: 11 });

    const r = present(5);
    expect(chain(r).map((n) => n * 2).done()).toEqual({ tag: "present", present: 10 });

    const o = present(3);
    expect(chain(o).map((n) => n + 7).done()).toEqual({ tag: "present", present: 10 });

    expect(chain(err("x")).done()).toEqual({ tag: "error", error: { tag: "x", x: undefined } });
    expect(chain(none()).done()).toEqual({ tag: "none", none: undefined });
  });

  it("a non-present variant seed short-circuits with no steps run", () => {
    const step = vi.fn((n: number) => present(n + 1));
    expect(chain(err("nope")).andThen(step).done()).toEqual({
      tag: "error",
      error: { tag: "nope", nope: undefined },
    });
    expect(step).not.toHaveBeenCalled();
  });
});
