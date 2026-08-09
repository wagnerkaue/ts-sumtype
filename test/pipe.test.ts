import { describe, it, expect, vi } from "vitest";
import { ok, err, errVariant, some, none, pipeResult, pipeOption } from "../src/index";

describe("pipeResult", () => {
  it("success chain and short-circuit on error", () => {
    const step2 = vi.fn((n: number) => ok(n * 2));

    const success = pipeResult(ok(5), (n) => ok(n + 1), step2);
    expect(success).toEqual({ tag: "ok", ok: 12 });
    expect(step2).toHaveBeenCalledTimes(1);

    step2.mockClear();
    const fail = pipeResult(ok(5), () => err("stop"), step2);
    expect(fail).toEqual({ tag: "error", error: "stop" });
    expect(step2).not.toHaveBeenCalled();
  });

  it("a raw seed and raw (unwrapped) passthrough steps are allowed", () => {
    expect(pipeResult(10, (n) => n + 1)).toBe(11);
    expect(pipeResult(10, (n) => n + 1, (n) => ok(n * 2))).toEqual({ tag: "ok", ok: 22 });
  });

  it("pipeResult(value) with no steps returns value unchanged", () => {
    expect(pipeResult(10)).toBe(10);
    expect(pipeResult(ok(1))).toEqual({ tag: "ok", ok: 1 });
  });

  it("a halting seed short-circuits with no steps run", () => {
    const step = vi.fn((n: number) => ok(n + 1));
    expect(pipeResult(errVariant({ nope: null }), step)).toEqual({
      tag: "error",
      error: { tag: "nope", nope: null },
    });
    expect(step).not.toHaveBeenCalled();
  });
});

describe("pipeOption", () => {
  it("success chain and short-circuit on none", () => {
    const step2 = vi.fn((n: number) => some(n * 2));

    const success = pipeOption(some(3), (n) => some(n + 1), step2);
    expect(success).toEqual({ tag: "some", some: 8 });
    expect(step2).toHaveBeenCalledTimes(1);

    step2.mockClear();
    const fail = pipeOption(some(3), () => none<number>(), step2);
    expect(fail).toEqual({ tag: "none", none: null });
    expect(step2).not.toHaveBeenCalled();
  });

  it("a raw seed and raw (unwrapped) passthrough steps are allowed", () => {
    expect(pipeOption(10, (n) => n + 1)).toBe(11);
    expect(pipeOption(10, (n) => n + 1, (n) => some(n * 2))).toEqual({ tag: "some", some: 22 });
  });

  it("pipeOption(value) with no steps returns value unchanged", () => {
    expect(pipeOption(10)).toBe(10);
    expect(pipeOption(some(1))).toEqual({ tag: "some", some: 1 });
  });

  it("a halting seed short-circuits with no steps run", () => {
    const step = vi.fn((n: number) => some(n + 1));
    expect(pipeOption(none<number>(), step)).toEqual({ tag: "none", none: null });
    expect(step).not.toHaveBeenCalled();
  });
});
