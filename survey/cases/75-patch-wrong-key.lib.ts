// @case    patch-wrong-key
// @feature patch()
// @kind    mistake
// @title   A key that the part being updated does not have
// @intent  Parse the card number inside an order; the author misspells `card`.

import { patch } from "ts-sumtype";

type Order = { code: string; payment: { card: { number: string } } };
type ParsedOrder = { code: string; payment: { card: { number: number } } };

export function parseNumber(order: Order): ParsedOrder {
  return patch(order, { payment: { crad: { number: Number } } });
}
