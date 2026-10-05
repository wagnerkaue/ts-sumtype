// @case    patch-wrong-key
// @feature object spread
// @kind    mistake
// @title   A key that the part being updated does not have
// @intent  Parse the card number inside an order; the author misspells `card`.

type Order = { code: string; payment: { card: { number: string } } };
type ParsedOrder = { code: string; payment: { card: { number: number } } };

export function parseNumber(order: Order): ParsedOrder {
  return {
    ...order,
    payment: { ...order.payment, card: { ...order.payment.crad, number: Number(order.payment.card.number) } },
  };
}
