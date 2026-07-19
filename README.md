# sumtype

> A convention for representing sum types in TypeScript, and the primitives that remove its boilerplate.

![dependencies 0](https://img.shields.io/badge/dependencies-0-brightgreen)
![module ESM + CJS](https://img.shields.io/badge/module-ESM%20%2B%20CJS-blue)
![types included](https://img.shields.io/badge/types-included-blue)
![license MIT](https://img.shields.io/badge/license-MIT-blue)

```sh
npm install sumtype      # or: pnpm add sumtype · yarn add sumtype · bun add sumtype
```

[Variant](#variant) · [Reading a variant](#reading-a-variant) · [isVariant](#isvariant) · [matchTag](#matchtag) · [Result](#result) · [Option](#option) · [Shared helpers](#shared-helpers) · [chain](#chain) · [Async](#async) · [Adapting existing data](#adapting-existing-data) · [Semantics & gotchas](#semantics--gotchas) · [Entry points](#entry-points)

```typescript
import { variant, matchTag, type Variant } from "sumtype";

type PaymentMethod =
  | Variant<"cash">
  | Variant<"paypal", { email: string }>
  | Variant<"creditCard", { cardNumber: string; expiryDate: string; cvv: number }>
  | Variant<"crypto", { address: string; currency: Variant<"bitcoin"> | Variant<"ethereum"> | Variant<"solana"> }>;

function describe(method: PaymentMethod): string {
  return matchTag(method, {
    cash:       ()  => "cash",
    paypal:     (p) => `PayPal (${p.email})`,
    creditCard: (c) => `card ending ${c.cardNumber.slice(-4)}`,
    crypto:     (c) => matchTag(c.currency, {
      bitcoin:  () => `BTC → ${c.address}`,
      ethereum: () => `ETH → ${c.address}`,
      solana:   () => `SOL → ${c.address}`,
    }),
  });
}

variant("paypal", { email: "a@b.com" });
// { tag: "paypal", paypal: { email: "a@b.com" } }
```

The rest of this README derives that shape from a plain TypeScript starting point, the way most codebases already write a sum type.

---

## Variant

The common way to model a set of cases in TypeScript is one interface per case, each carrying a discriminant field, joined into a union:

```typescript
interface CashPayment {
  kind: "Cash";
}

interface PayPalPayment {
  kind: "PayPal";
  email: string;
}

interface CreditCardPayment {
  kind: "CreditCard";
  cardNumber: string;
  expiryDate: string;
  cvv: number;
}

type PaymentMethod = CashPayment | PayPalPayment | CreditCardPayment;
```

`CreditCardPayment`, looked at on its own, is supposed to be the shape of a credit card payment's data. But it also carries `kind: "CreditCard"`, not a fact about the card itself (its number, its expiry, its cvv), but a fact about where `CreditCardPayment` sits inside `PaymentMethod`. A function that processes a `CreditCardPayment` ignores `kind`; a function that constructs one has to supply it anyway, even though nothing about the card depends on it. The union needs a discriminant to tell its members apart, and that need has leaked into the definition of each member.

Rust keeps this boundary where TypeScript doesn't: `enum PaymentMethod { Cash, PayPal(PayPalPayment), CreditCard(CreditCardPayment) }` puts the tag at the enum, and `struct CreditCardPayment { card_number: String, ... }` has no idea it's ever wrapped in one. TypeScript has no built-in tagged union, so the usual workaround is to fold the tag into each payload, which is exactly the fold that leaks it.

Pulling `kind` back out and wrapping each payload under a key gives the payload interfaces nothing to do with the union at all:

```typescript
interface CashPayment {}
interface PayPalPayment { email: string; }
interface CreditCardPayment { cardNumber: string; expiryDate: string; cvv: number; }

type PaymentMethod =
  | { kind: "Cash"; cash: CashPayment }
  | { kind: "PayPal"; paypal: PayPalPayment }
  | { kind: "CreditCard"; creditCard: CreditCardPayment };
```

The tag values (`"Cash"`, `"PayPal"`, `"CreditCard"`) and the payload keys (`cash`, `paypal`, `creditCard`) name the same case twice, in two different spellings. Line them up, same casing, same word, and the tag stops being a separate vocabulary from the payload keys it's naming:

```typescript
type PaymentMethod =
  | { tag: "cash"; cash: CashPayment }
  | { tag: "paypal"; paypal: PayPalPayment }
  | { tag: "creditCard"; creditCard: CreditCardPayment };
```

That symmetry is what reading the union looks like afterward: `method.cash`, `method.paypal.email`, `method.creditCard.cardNumber`. `method.creditCard` is a single value, every field belonging to the credit card case, grouped under one name, and nothing else. The flat version has no equivalent: `cardNumber`, `expiryDate`, and `cvv` are just fields on `method`, related to each other only by convention, not by any name you could read off or hand to something else. A function that wants the card's data can be passed `method.creditCard` directly; the same function working against the flat version has to be passed all of `method` and pick the right fields off it itself.

`Variant<K, T>` is this shape, generalized, a `tag` and a payload stored under a key named after that tag, and `variant(tag, payload)` builds one:

```typescript
import { variant, type Variant } from "sumtype";

type PaymentMethod =
  | Variant<"cash">
  | Variant<"paypal", { email: string }>
  | Variant<"creditCard", { cardNumber: string; expiryDate: string; cvv: number }>;

variant("paypal", { email: "a@b.com" });
// { tag: "paypal", paypal: { email: "a@b.com" } }

variant("cash");
// { tag: "cash", cash: undefined }
```

`CashPayment` had no fields to begin with, `Variant<"cash">` is the same case with no payload, not a special case: the key is always present, typed `undefined` when there's nothing to store.

Whether that "nothing to store" is really nothing is worth pinning down, because TypeScript makes it easy to fake a case with no payload using a plain string, and that's a narrower move than it looks. A crypto payment's currency, done the ordinary way, is a string literal union:

```typescript
type Currency = "Bitcoin" | "Ethereum" | "Solana";

function networkFeeSats(currency: Currency): number {
  if (currency === "Bitcoin") return 0;
  // ...
}
```

Say bitcoin later needs its own data, a network (mainnet vs testnet), say. `currency` can no longer be a bare string once one of its members needs a payload, so it becomes `{ tag: "bitcoin", network: Network } | "Ethereum" | "Solana"` or some other reshaping, and every existing `currency === "Bitcoin"` becomes `currency.tag === "bitcoin"` (or worse, a mix, depending on which member you're checking). The code that already worked, that never asked to change, has to change anyway, that's extension forcing modification, not being open to it.

It's tempting to read the literal-union version as a discriminated union with no payload, interchangeable with the tagged version until a payload shows up. It isn't. TypeScript narrows `currency === "Bitcoin"` and `currency.tag === "bitcoin"` by the same control-flow analysis, and both give you exhaustiveness in a `switch`, so they look like two spellings of the same thing. But the literal union narrows because the *value itself* is the discriminant, with nowhere to put a payload; the tagged version narrows because the discriminant is a *field*, separate from a payload slot that's already sitting there. They only look interchangeable in the case that has no data yet, which is precisely the case that can't tell you whether it's ever going to need any. Modeling every case as `Variant`, even the ones you're confident will stay empty, means there's no separate representation to fall out of, extending a case is always additive, never a reshape, because the slot was always there:

```typescript
type Currency = Variant<"bitcoin"> | Variant<"ethereum"> | Variant<"solana">;

variant("bitcoin");
// { tag: "bitcoin", bitcoin: undefined }
```

A union of variants is a whole state you can hold in one variable, pass, and return, the payload itself can be another union of variants, the same way `Currency` sits inside `crypto`:

```typescript
type PaymentMethod =
  | Variant<"cash">
  | Variant<"paypal", { email: string }>
  | Variant<"creditCard", { cardNumber: string; expiryDate: string; cvv: number }>
  | Variant<"crypto", { address: string; currency: Currency }>;
```

---

## Reading a variant

You read a variant with `.tag` and the tag-named payload key, and a check on the tag narrows the union to one case, after which that case's key is reachable:

```typescript
function processorFee(method: PaymentMethod): number {
  if (method.tag === "creditCard") {
    return method.creditCard.cvv > 0 ? 0.024 : 0.024; // method is the creditCard case here
  }
  return 0;
}
```

Because the key is named after the case, nested variants read as the path through them, `method.crypto.currency`, not `method.payload.payload`. The compiler also won't let you touch a case's key before you've narrowed to it, so a mistaken read is a type error rather than an `undefined` at runtime.

`switch` narrows the same way, one case per tag:

```typescript
function processorFee(method: PaymentMethod): number {
  switch (method.tag) {
    case "cash":       return 0;
    case "paypal":     return 0.029;
    case "creditCard": return 0.024;
    case "crypto":     return 0.01;
  }
}
```

A variant serializes as-is, no `toJSON`, no revival step:

```typescript
JSON.stringify(variant("paypal", { email: "a@b.com" }));
// {"tag":"paypal","paypal":{"email":"a@b.com"}}

JSON.stringify(variant("cash"));
// {"tag":"cash"}   (JSON drops undefined values)
```

---

## isVariant

A tag check reads one case; some code needs to ask about several at once, which methods refund instantly versus which need manual review, say. `isVariant(v, ...tags)` is a type guard: it's true when `v`'s tag is one of the tags you pass, and it narrows `v` accordingly. Pass one tag to test one case, or several to match **any** of them:

```typescript
import { isVariant } from "sumtype";

// one tag, narrows to that case
const isCreditCard = (m: PaymentMethod) => isVariant(m, "creditCard");

// several tags, matches any (logical OR), with no `.tag === "a" || .tag === "b"`
const isInstantRefund = (m: PaymentMethod) => isVariant(m, "cash", "creditCard");
```

Every tag is checked against `v`'s own tags, so a typo is a compile error. Because it narrows both branches, it reads naturally as an early-return guard, the negated form narrows the *rest* of the function to everything the guard excluded:

```typescript
type Muted =
  | Variant<"off">
  | Variant<"temporary", { until: Date }>
  | Variant<"forever">;

function isMutedNow(m: Muted): boolean {
  if (isVariant(m, "off")) return false;
  if (isVariant(m, "forever")) return true;
  return m.temporary.until > new Date();   // m is narrowed to the temporary case
}
```

`isVariant` is the general form of the per-type guards you'll meet below, `isPresent`, `isNone`, `isErr` are the same guard fixed to one tag. It works on any `{ tag }`-shaped value, including a plain `.tag === "x"` you could write by hand; reach for it when you want the OR form, a reusable predicate (`methods.filter((m) => isVariant(m, "crypto"))`), or simply one consistent spelling.

---

## matchTag

A tag check reads one case. `matchTag` handles them all at once, one branch per tag. Each branch is either a **function arm** that receives the payload, or a **value arm** returned as-is:

```typescript
import { matchTag } from "sumtype";

const describe = (method: PaymentMethod) =>
  matchTag(method, {
    cash:       "cash",                          // value arm, returned as-is
    paypal:     (p) => `PayPal (${p.email})`,     // function arm, receives the payload
    creditCard: (c) => `card ending ${c.cardNumber.slice(-4)}`,
    crypto:     (c) => `${c.address}`,
  });
```

`cash` carries no payload, so there's nothing for a function arm to receive, a plain value is enough. With every tag handled, the cases object is exhaustive and the compiler enforces it, add a case to `PaymentMethod` and this call stops compiling until you handle it.

### The fallback

Handle only some tags by passing a third argument for the rest. It receives the whole unmatched variant, not a payload:

```typescript
const refundPlan = (method: PaymentMethod) =>
  matchTag(
    method,
    {
      cash:       () => "instant",
      creditCard: () => "instant",
    },
    (rest) => `manual review (${rest.tag})`, // rest is paypal | crypto here
  );
```

### Composing matches

A payload can itself be a variant, so an arm reads it the same way, one level in, a crypto payment's `currency` is matched inside the `crypto` arm:

```typescript
const describe = (method: PaymentMethod) =>
  matchTag(method, {
    cash:       ()  => "cash",
    paypal:     (p) => `PayPal (${p.email})`,
    creditCard: (c) => `card ending ${c.cardNumber.slice(-4)}`,
    crypto:     (c) =>
      matchTag(c.currency, {                 // c.currency is Currency, its own tag
        bitcoin:  () => `BTC → ${c.address}`,
        ethereum: () => `ETH → ${c.address}`,
        solana:   () => `SOL → ${c.address}`,
      }),
  });
```

That inner `matchTag(c.currency, ...)` is exactly the read the tag-named keys are for: each hop names where you are.

- Only **own** properties of the cases object dispatch; inherited keys (`toString`, `constructor`, …) fall through to the fallback.
- An arm set to `undefined` is a value arm: `matchTag` returns `undefined` and the fallback does not run.

When a payload didn't arrive shaped as a `Variant` at all, see [Adapting existing data](#adapting-existing-data).

---

## Result

Another common pattern for a value that's either a success or a failure is a boolean discriminant:

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

This is the same union-with-a-discriminant shape as the payment method's first draft, just with the discriminant narrowed to two values instead of a string. It has the same asymmetry problem: `value` and `error` don't share a name with anything on `ok`, so there's no tag-to-key correspondence to read by, and no way to fold it into a `switch` over a shared `tag` the way every other sum type in a codebase would be. `Result<T, E>` here is `Present<T> | Err<E>` instead, the same two cases, built from the same `Variant` convention as everything else:

```typescript
import { present, err, type Result } from "sumtype";

type ValidationErr =
  | Variant<"expired", { expiredOn: string }>
  | Variant<"badAddress", { address: string }>;

function validateMethod(method: PaymentMethod): Result<PaymentMethod, ValidationErr> {
  if (isVariant(method, "creditCard") && hasExpired(method.creditCard.expiryDate)) {
    return err("expired", { expiredOn: method.creditCard.expiryDate });
  }
  if (isVariant(method, "crypto") && !isValidAddress(method.crypto.address)) {
    return err("badAddress", { address: method.crypto.address });
  }
  return present(method);
}

const v = validateMethod(method);
if (v.tag === "error") {
  report(v.error);     // v is Err<ValidationErr> here
} else {
  charge(v.present, 500); // v is Present<PaymentMethod> here
}
```

Operations on a `Result` are free functions, `unwrap(r)`, not `r.unwrap()`, and the value is a plain union, so `console.log`, `JSON.stringify`, and `switch` work on it directly. Because a guard narrows the union and hands you the error branch to forward as-is, **early return is the default control-flow style**, the same as any other variant.

### Errors carry their own tag

`err` builds an error whose payload is itself a tagged variant, so when several errors can occur they stay discriminable by their inner tag:

```typescript
err("expired", { expiredOn: "2027-01-01" });
// { tag: "error", error: { tag: "expired", expired: { expiredOn: "2027-01-01" } } }
```

`err` is `tagged("error")`, a constructor pre-nested under one outer tag. Build your own the same way for deeper taxonomies, like the failures a payment gateway call can return:

```typescript
import { tagged } from "sumtype";

const gatewayErr = tagged("error", "gateway");
gatewayErr("declined", { reason: "insufficient_funds" });
// { tag: "error", error: { tag: "gateway", gateway: { tag: "declined", declined: { reason: "insufficient_funds" } } } }

gatewayErr("timeout");
// { tag: "error", error: { tag: "gateway", gateway: { tag: "timeout", timeout: undefined } } }
```

When the error has no tag of its own, a caught `unknown`, or a bare sentinel, construct it directly with `variant("error", value)`.

### Functions on Result

| Function | Result |
|---|---|
| `present(value)` | `Present<T>` |
| `err(tag, payload?)` | `Err<Variant<tag, payload>>` |
| `isPresent(r)` / `isErr(r)` | type guards |
| `fromThrowable(f, mapError?)` | runs `f`, catching a throw into `Err` |
| `allErrors(results)` | one `Present` of every value, or an `Err` collecting **every** error |
| `toOption(r)` | `Present → Present` (unchanged), `Err → None` |

`allErrors` gathers all failures. When you want to stop at the first one instead, use [`all`](#collecting-results).

---

## Option

`Option<T>` is `Present<T> | None`, a value that may be absent. Its present case **is** a `Present<T>`, the same variant a `Result` carries: build the present case with `present`, the absent case with `none`. Because an `Option<T>` is a different type from `T`, absence is part of the type, so the compiler makes you account for it. Not every customer has a saved payment method:

```typescript
import { present, none, isPresent, type Option } from "sumtype";

type Customer = {
  id: string;
  email: string;
  savedMethod: Option<PaymentMethod>;
};

const c: Customer = loadCustomer(id);
if (isPresent(c.savedMethod)) charge(c.savedMethod.present, cents); // present payload is a PaymentMethod
```

Because `Option` and `Result` share the `present` case, `presentOr` and `toOption` convert between them without rebuilding the value, and a `chain` over an `Option` resolves back to `Present<T> | None`.

`none()` returns a fresh object each call, so compare it by tag (`isNone(o)` or `o.tag === "none"`), never with `===`.

| Function | Result |
|---|---|
| `present(value)` / `none()` | `Present<T>` / `None` |
| `isPresent(o)` / `isNone(o)` | type guards |
| `presentOr(o, error)` | `Present → Present` (unchanged), `None → Err(error)` |

---

## Shared helpers

Because a `Result` and an `Option` are both sum types with a `Present` case, these read either one, they dispatch on the tag at runtime, so one function serves both:

```typescript
import { unwrap, unwrapOr, expect, fromNullable } from "sumtype";

unwrap(validateMethod(method));   // PaymentMethod    (Present → value)
unwrap(c.savedMethod);            // PaymentMethod, or throws if none saved

unwrapOr(validateMethod(method), variant("cash"));  // the validated method, or cash on a validation error
unwrapOr(c.savedMethod, variant("cash"));           // the saved method, or cash as a default

expect(c.savedMethod, "no saved payment method"); // PaymentMethod, or throws Error("no saved payment method")
```

`fromNullable` reads its arity: one argument produces an `Option`, two produce a `Result` with the second as the error. A customer record arriving from the network with a nullable field is the natural source:

```typescript
fromNullable(raw.savedMethod);           // Option<PaymentMethod>
fromNullable(raw.savedMethod, "no method"); // Result<PaymentMethod, "no method">
```

### Collecting results

`all` walks an array of present-shaped values, returning the tuple of payloads or short-circuiting on the first value that isn't a `Present`. Like `chain`, it works over `Result` arrays, `Option` arrays, or a mix, the halt track is whatever non-present variants the array can hold:

```typescript
import { all } from "sumtype";

all([validateMethod(a), validateMethod(b)]);      // Present<[PaymentMethod, PaymentMethod]>
all([validateMethod(a), validateMethod(bad)]);    // Err, stops at the first invalid method

all([customerA.savedMethod, customerB.savedMethod]); // Present<[PaymentMethod, PaymentMethod]>
all([customerA.savedMethod, noMethod.savedMethod]);  // None, stops at the first absent method
```

An empty array never halts, so `all([])` is always `Present<[]>`.

---

## chain

`chain` threads a value through a linear sequence of steps. Build it, thread through it, call `.done()` once, and only the plain sum type leaves the expression. It is never a return type or a parameter type; it lives entirely inside a function body.

```typescript
import { chain, present, type Present, type Err } from "sumtype";

// .andThen(f) runs f on the value and continues with its payload; anything
// that isn't a Present from a step (an Err or None) short-circuits the rest.
function checkout(method: PaymentMethod, cents: number): Present<Receipt> | Err<ValidationErr> | Err<GatewayErr> {
  return chain(present(method))
    .andThen(validateMethod)              // PaymentMethod → Result<PaymentMethod, ValidationErr>
    .andThen((m) => chargeGateway(m, cents)) // PaymentMethod → Result<Receipt, GatewayErr>
    .done();
}
```

A chain can mix `Result` and `Option` steps; the return type is then the union of every branch's outcome, spelled out. Looking a customer up, falling back to their saved method, then validating and charging it is four steps across two different sum types:

```typescript
type NotFoundErr = Variant<"notFound", { customerId: string }>;
type NoSavedMethod = Variant<"noSavedMethod">;

function checkoutForCustomer(
  customerId: string,
  cents: number,
): Present<Receipt> | Err<NotFoundErr> | Err<NoSavedMethod> | Err<ValidationErr> | Err<GatewayErr> {
  return chain(present(customerId))
    .andThen(findCustomer)                                                // string   → Result<Customer, NotFoundErr>
    .andThen((c) => presentOr(c.savedMethod, variant("noSavedMethod")))    // Customer → Result<PaymentMethod, NoSavedMethod>
    .andThen(validateMethod)                                              // PaymentMethod → Result<PaymentMethod, ValidationErr>
    .andThen((m) => chargeGateway(m, cents))                              // PaymentMethod → Result<Receipt, GatewayErr>
    .done();
}
```

`chain` only checks whether each step returned a `Present`; anything else, an `Err`, a `None`, halts it, which is why it needs no notion of `Result` or `Option`. It seeds from a `Present` (wrap a plain value with `present(x)`), or from an already-built `Result` / `Option`, which may already be an `Err` / `None` and short-circuits from the start. A bare, non-variant value isn't a present value, so it's rejected at compile time, write `chain(present(x))`.

`.andThen` reads its function's return value as a signal, anything that isn't a `Present` (an `Err` / `None`) stops the chain. `.map` never does: a plain object that happens to have a `tag` field passes through `.map` as inert data.

---

## Async

Sequence async steps with a plain `async function` and the same early-return guards. Swapping the synchronous gateway call for a networked one changes nothing about the control flow:

```typescript
async function checkout(
  method: PaymentMethod,
  cents: number,
): Promise<Result<Receipt, ValidationErr | GatewayErr>> {
  const validated = validateMethod(method);
  if (isVariant(validated, "error")) return validated;

  return await chargeGateway(validated.present, cents); // Promise<Result<Receipt, GatewayErr>>
}
```

The `Result` flows through `await` untouched, since it's just a value.

---

## Adapting existing data

A sum type is a tag and a payload. Some data carries exactly that, a case and its fields, but under a different spelling: a flat discriminated union, a union keyed by other names, a bare string-literal enum. `fromFlat`, `fromKeyed`, and `fromEnum` rewrite each into a `Variant`, once, where the data enters your program.

### fromFlat

A flat discriminated union, one object per case, keyed by a shared field, is the shape this README opened with, and it's also the shape a payment gateway's webhook actually sends:

```typescript
type RawEvent =
  | { kind: "cash" }
  | { kind: "paypal"; email: string }
  | { kind: "creditCard"; cardNumber: string; expiryDate: string; cvv: number };
```

`fromFlat(key, value)` moves every key but the discriminant under the tag-named key:

```typescript
import { fromFlat } from "sumtype";

fromFlat("kind", { kind: "paypal", email: "a@b.com" });
// { tag: "paypal", paypal: { email: "a@b.com" } }
```

Passed a whole union value, it distributes member-by-member, so the result type is the full `Variant<"cash", {}> | Variant<"paypal", {...}> | Variant<"creditCard", {...}>` union, not one `Variant` whose tag and payload are each a flat union. Called with one argument, it returns a reusable converter, for `events.map(fromFlat("kind"))`.

### fromKeyed

Some data is already nested, just under different key names than `tag` and the payload, a gateway that groups every case's fields under one `details` object, say:

```typescript
type RawEvent =
  | { type: "creditCard"; details: { cardNumber: string; expiryDate: string; cvv: number } }
  | { type: "paypal"; details: { email: string } };
```

`fromKeyed(tagKey, payloadKey, value)` renames rather than flattens:

```typescript
import { fromKeyed } from "sumtype";

fromKeyed("type", "details", { type: "paypal", details: { email: "a@b.com" } });
// { tag: "paypal", paypal: { email: "a@b.com" } }
```

Same two-args-returns-a-converter shape as `fromFlat`.

### fromEnum

A bare string-literal union, a currency arriving as `"bitcoin" | "ethereum" | "solana"` from a source you don't control, becomes its unit `Variant`:

```typescript
import { fromEnum } from "sumtype";

fromEnum("bitcoin"); // { tag: "bitcoin", bitcoin: undefined }
```

This is the same representation this README argued against building new code around, back in [Variant](#variant), useful at a boundary you don't control, not as the shape to reach for when you do. `variant(tag)` does the same conversion, but takes an optional second payload argument, so `arr.map(variant)` silently feeds each element's array index in as its payload. `fromEnum` is unary and ignores any extra callback arguments, so it's safe to pass directly to `map` / `filter` / etc.

---

## Semantics & gotchas

- **The payload key is named after the tag, and always present.** `{ tag: "cash" }` alone does not satisfy `Variant<"cash">`, write `variant("cash")` or `{ tag: "cash", cash: undefined }`.
- **`"tag"` is a reserved tag name.** Its payload key would collide with the discriminant, so `Variant<"tag", T>` reduces to `never`. Pick any other tag.
- **Variance is covariant.** `Result<Receipt, never>` is assignable to `Result<Receipt, GatewayErr>`; the reverse (narrowing) is a type error.
- **Payloads must be JSON-safe** to survive a `JSON.stringify` / `JSON.parse` round-trip; `undefined` payloads are dropped from the wire format.

> [!WARNING]
> `none()` is a fresh object each call. Compare it by tag (`isNone(o)` or `o.tag === "none"`), never with `===`.

- **A `const` whose initializer is narrower than its declared type** can confuse overload resolution at a generic call site:

  ```typescript
  const cached: Result<number, ValidationErr> = err("expired", { expiredOn: "2020-01-01" });
  unwrapOr(cached, 0); // may fail: the generic is inferred from the construction site
  ```

  Give an explicit type argument (`unwrapOr<Result<number, ValidationErr>>(cached, 0)`), or let a function's declared return type produce the value, which is how ordinary code reads, since signatures name the sum type.

---

## Entry points

The root export re-exports everything. Each module is also individually importable:

```ts
import { present } from "sumtype/result";
import { matchTag } from "sumtype/match";
```

`sumtype/variant`, `/match`, `/present`, `/result`, `/option`, `/chain`, `/adapt`.

---

## License

MIT
