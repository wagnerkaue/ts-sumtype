import { describe, it, expect } from "vitest";
import { ok, err, map, tryOver, over, type Result, type Fallible } from "../src/index";

type Pair = readonly [string, number];
type Order = { code: string; payment: { card: { number: string } } };
type ParsedOrder = { code: string; payment: { card: { number: number } } };

describe("tryOver", () => {
  it("runs the step on one element of a tuple", () => {
    const increment: Fallible<Pair, Pair, never> = tryOver(1, (n) => ok(n + 1));
    expect(increment(["a", 1])).toEqual(ok(["a", 2]));
  });

  it("passes the step's error through", () => {
    const fail = (_n: number): Result<number, string> => err("bad");
    const failing: Fallible<Pair, Pair, string> = tryOver(1, fail);
    expect(failing(["a", 1])).toEqual(err("bad"));
  });

  it("nests, changing the type deep inside without touching the original", () => {
    const parseNumber: Fallible<Order, ParsedOrder, never> = tryOver("payment", tryOver("card", tryOver("number", map(Number))));
    const order: Order = { code: "A-1", payment: { card: { number: "4111" } } };
    expect(parseNumber(order)).toEqual(ok({ code: "A-1", payment: { card: { number: 4111 } } }));
    expect(order.payment.card.number).toBe("4111");
  });
});

describe("over", () => {
  it("updates one field of each element", () => {
    expect([{ name: "a", size: 1 }].map(over("size", (size) => size * 10))).toEqual([{ name: "a", size: 10 }]);
  });

  it("updates one element of each tuple", () => {
    const pairs: readonly (readonly [string, number])[] = [["a", 1]];
    expect(pairs.map(over(1, (n) => `${n}`))).toEqual([["a", "1"]]);
  });
});
