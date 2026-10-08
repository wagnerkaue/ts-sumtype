// @case    mapcases-missing-case
// @feature switch with a declared return type
// @kind    mistake
// @title   One case has no handler in a change that keeps each case
// @intent  Mask the personal data in every kind of payment method; the author forgot `crypto`.

type PaymentMethod =
  | { kind: "cash" }
  | { kind: "paypal"; email: string }
  | { kind: "card"; number: string; expiry: string }
  | { kind: "crypto"; address: string };

export function masked(method: PaymentMethod): PaymentMethod {
  switch (method.kind) {
    case "cash":
      return method;
    case "paypal":
      return { kind: "paypal", email: `***@${method.email.split("@")[1]}` };
    case "card":
      return { kind: "card", number: `**** ${method.number.slice(-4)}`, expiry: method.expiry };
  }
}
