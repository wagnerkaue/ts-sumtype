// @case    mapcases-missing-case
// @feature mapCases()
// @kind    mistake
// @title   One case has no handler in a change that keeps each case
// @intent  Mask the personal data in every kind of payment method; the author forgot `crypto`.

import { mapCases, type Sum, type Unit } from "ts-sumtype";

type PaymentMethod = Sum<{
  cash: Unit;
  paypal: { email: string };
  card: { number: string; expiry: string };
  crypto: { address: string };
}>;

export const masked = (method: PaymentMethod): PaymentMethod =>
  mapCases(method, {
    cash: (cash) => cash,
    paypal: ({ email }) => ({ email: `***@${email.split("@")[1]}` }),
    card: ({ number, expiry }) => ({ number: `**** ${number.slice(-4)}`, expiry }),
  });
