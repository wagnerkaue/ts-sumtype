// @case    zoom-wrong-key
// @feature zoom()
// @kind    mistake
// @title   A key that the part being updated does not have
// @intent  Parse the card number inside an order; the author misspells `card`.

import { zoom, map, type Step } from "ts-sumtype";

type Order = { code: string; payment: { card: { number: string } } };
type ParsedOrder = { code: string; payment: { card: { number: number } } };

export const parseNumber: Step<Order, ParsedOrder, never> = zoom(
  "payment",
  zoom("crad", zoom("number", map(Number))),
);
