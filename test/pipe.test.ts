import { describe, it, expect, vi } from "vitest";
import { ok, err, errVariant, pipeResult } from "../src/index";

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

  it("a raw seed and a raw (unwrapped) passthrough step are allowed, but the result is always a Result", () => {
    expect(pipeResult(10, (n) => n + 1)).toEqual({ tag: "ok", ok: 11 });
    expect(pipeResult(10, (n) => n + 1, (n) => ok(n * 2))).toEqual({ tag: "ok", ok: 22 });
  });

  it("pipeResult(value) with no steps still returns a Result", () => {
    expect(pipeResult(10)).toEqual({ tag: "ok", ok: 10 });
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
