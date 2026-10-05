// @case    tryover-wrong-key
// @feature tryOver()
// @kind    mistake
// @title   A key that the part being updated does not have
// @intent  Parse the card number inside an order; the author misspells `card`.

import { tryOver, ok, type Fallible } from "ts-sumtype";

type Order = { code: string; payment: { card: { number: string } } };
type ParsedOrder = { code: string; payment: { card: { number: number } } };

export const parseNumber: Fallible<Order, ParsedOrder, never> = tryOver(
  "payment",
  tryOver("crad", tryOver("number", (number: string) => ok(Number(number)))),
);
