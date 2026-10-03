import { describe, it, expect, vi } from "vitest";
import {
  ok, err, errVariant, some, none, entries, variant,
  flow, tryFlow, map, lazy, prepend, attempt, rejectWith, rejectIf, tryFlatMap, match, tryMatch,
  type Step, type Sum,
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
    const step = tryFlow(
      map((n: number) => n + 1),
      map((n) => n * 10),
    );
    expect(step(2)).toEqual(ok(30));
    expect(step(4)).toEqual(ok(50));
  });

  it("stops at the first error", () => {
    const after = vi.fn((n: number) => n);
    const step = tryFlow(
      rejectIf((n: number) => n === 1, "one"),
      map(after),
    );
    expect(step(1)).toEqual(errVariant("one"));
    expect(after).not.toHaveBeenCalled();
  });
});

describe("prepend", () => {
  it("puts the given items first", () => {
    expect(prepend([1])([2, 3])).toEqual([1, 2, 3]);
  });

  it("joins a chain of steps through map", () => {
    expect(tryFlow(map(prepend([1])))([2, 3])).toEqual(ok([1, 2, 3]));
  });
});

describe("attempt", () => {
  it("wraps the step's error under its tag", () => {
    expect(attempt(() => err("bad"), "parse")("x")).toEqual(errVariant("parse", "bad"));
  });

  it("passes a success through", () => {
    expect(attempt((n: number) => ok(n + 1), "parse")(1)).toEqual(ok(2));
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

describe("tryFlatMap", () => {
  it("concatenates every entry's results", () => {
    const pairs = tryFlatMap(({ key, payload }) => ok([key, payload]), "item");
    expect(pairs(entries({ a: 1, b: 2 }))).toEqual(ok(["a", 1, "b", 2]));
  });

  it("locates the first failing entry by its key", () => {
    const withoutTwo = tryFlatMap(
      ({ payload }: { key: string; payload: number }) => (payload === 2 ? err("two") : ok([payload])),
      "item",
    );
    expect(withoutTwo(entries({ a: 1, b: 2, c: 3 }))).toEqual(errVariant("item", { at: "b", error: "two" }));
  });
});

describe("entries", () => {
  it("lists a record's keys and payloads in its own order", () => {
    expect(entries({ code: 1, name: 2 })).toEqual([
      { key: "code", payload: 1 },
      { key: "name", payload: 2 },
    ]);
  });
});

type Nest = Sum<{ leaf: number; wrap: Nest }>;

const depth: Step<Nest, number, never> = tryMatch({
  leaf: map(() => 0),
  wrap: tryFlow(lazy(() => depth), map((d) => d + 1)),
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
