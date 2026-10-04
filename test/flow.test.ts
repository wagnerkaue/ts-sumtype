import { describe, it, expect, vi } from "vitest";
import {
  ok, err, errVariant, some, none, variant,
  flow, tryFlow, step, lazy, prepend, rejectWith, rejectIf, match, tryMatch,
  type Fallible, type Sum,
} from "../src/index";

describe("flow", () => {
  it("composes left to right", () => {
    expect(flow((n: number) => n + 1, (n) => n * 10)(2)).toBe(30);
  });

  it("passes a Result on as it is", () => {
    const sign = flow((n: number) => (n < 0 ? err("negative") : ok(n)), (r) => r.tag);
    expect(sign(-1)).toBe("error");
    expect(sign(1)).toBe("ok");
  });
});

describe("tryFlow", () => {
  it("passes each step's value to the next", () => {
    const chain = tryFlow(
      step((n: number) => n + 1),
      step((n) => n * 10),
    );
    expect(chain(2)).toEqual(ok(30));
    expect(chain(4)).toEqual(ok(50));
  });

  it("stops at the first error", () => {
    const after = vi.fn((n: number) => n);
    const chain = tryFlow(
      rejectIf((n: number) => n === 1, "one"),
      step(after),
    );
    expect(chain(1)).toEqual(errVariant("one"));
    expect(after).not.toHaveBeenCalled();
  });
});

describe("prepend", () => {
  it("puts the given items first", () => {
    expect(prepend([1])([2, 3])).toEqual([1, 2, 3]);
  });

  it("joins a try composition through step", () => {
    expect(tryFlow(step(prepend([1])))([2, 3])).toEqual(ok([1, 2, 3]));
  });
});

describe("step", () => {
  it("makes a function that can't fail a Fallible with no error case", () => {
    expect(step((n: number) => n + 1)(1)).toEqual(ok(2));
  });

  it("wraps a fallible function's error under its tag", () => {
    expect(step(() => err("bad"), "parse")("x")).toEqual(errVariant("parse", "bad"));
  });

  it("passes a success through", () => {
    expect(step((n: number) => ok(n + 1), "parse")(1)).toEqual(ok(2));
  });
});

describe("rejectWith", () => {
  const negative = (n: number) => (n < 0 ? some(-n) : none());
  const nonNegative = rejectWith(negative, "negative");

  it("fails with the problem found, under its tag", () => {
    expect(nonNegative(-2)).toEqual(errVariant("negative", 2));
  });

  it("passes the value on when there is no problem", () => {
    expect(nonNegative(2)).toEqual(ok(2));
  });
});

describe("rejectIf", () => {
  it("passes the value on when the check does not hold", () => {
    expect(rejectIf((n: number) => n === 1, "one")(2)).toEqual(ok(2));
  });
});

type Nest = Sum<{ leaf: number; wrap: Nest }>;

const depth: Fallible<Nest, number, never> = tryMatch({
  leaf: step(() => 0),
  wrap: tryFlow(lazy(() => depth), step((d) => d + 1)),
});

const doubled: (nest: Nest) => number = match({
  leaf: (n) => n,
  wrap: flow(lazy(() => doubled), (n) => n * 2),
});

describe("lazy", () => {
  it("lets a chain of steps refer to the constant it is part of", () => {
    expect(depth(variant("wrap", variant("wrap", variant("leaf", 7))))).toEqual(ok(2));
  });

  it("does the same for plain functions", () => {
    expect(doubled(variant("wrap", variant("wrap", variant("leaf", 3))))).toBe(12);
  });
});
