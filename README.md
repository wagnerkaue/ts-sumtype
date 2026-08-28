# ts-sumtype

> Sum type for TypeScript where the discriminant is also the payload's key: the encapsulation of a boxed union, without its `.value.value` chains.

![dependencies 0](https://img.shields.io/badge/dependencies-0-brightgreen)
![module ESM + CJS](https://img.shields.io/badge/module-ESM%20%2B%20CJS-blue)
![types included](https://img.shields.io/badge/types-included-blue)
![license MIT](https://img.shields.io/badge/license-MIT-blue)

```sh
npm install ts-sumtype      # or: pnpm add ts-sumtype · yarn add ts-sumtype · bun add ts-sumtype
```

[Sum](#sum) · [Unit](#unit) · [Frozen](#frozen) · [Reading a variant](#reading-a-variant) · [isVariant](#isvariant) · [matchTag](#matchtag) · [Result](#result) · [Option](#option) · [Working across Result and Option](#working-across-result-and-option) · [pipeResult / pipeOption](#piperesult--pipeoption) · [Adapting existing data](#adapting-existing-data) · [Notes](#notes) · [Entry points](#entry-points)

```typescript
import { variant, matchTag, type Sum, type Unit } from "ts-sumtype";

type PaymentMethod = Sum<{
  cash: Unit;
  paypal: { email: string };
  creditCard: {
    cardNumber: string;
    expiryDate: string;
    cvv: number;
  };
  crypto: {
    address: string;
    currency: Sum<{
      bitcoin: Unit;
      ethereum: Unit;
      solana: Unit;
    }>;
  };
}>;

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

variant({ paypal: { email: "a@b.com" } });
// { tag: "paypal", paypal: { email: "a@b.com" } }
```

The rest of this README derives that shape from a plain TypeScript starting point, the way most codebases already write a sum type.

---

## Sum

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

The direct fix for that leak is to box the payload behind a generic key, the shape most `Result`/`Option`-style types reach for in most languages:

```typescript
interface CashPayment {}

interface PayPalPayment {
  email: string;
}

interface CreditCardPayment {
  cardNumber: string;
  expiryDate: string;
  cvv: number;
}

type PaymentMethod =
  | { tag: "cash"; value: CashPayment }
  | { tag: "paypal"; value: PayPalPayment }
  | { tag: "creditCard"; value: CreditCardPayment };
```

`CashPayment`, `PayPalPayment`, and `CreditCardPayment` are back to knowing nothing about the union. The leak is gone. But the fix bought that by throwing away the payload's name: every case reads through the same generic `.value`, so a nested sum reads as `.value.value`, telling you nothing about what's actually there until you cross-reference `.tag` at every level, and a function that wants "the credit card data" can't be handed a thing called `creditCard`, only a `.value` that happens, at this call site, to be one.

Nothing about that key has to be the generic word `value`, though. Once you've checked `.tag`, you already know what's stored there, so name the key after the tag itself, and the read becomes self-describing at every level instead of forcing a second lookup back through `.tag`:

```typescript
type PaymentMethod =
  | { tag: "cash"; cash: CashPayment }
  | { tag: "paypal"; paypal: PayPalPayment }
  | { tag: "creditCard"; creditCard: CreditCardPayment };
```

The tag values (`"cash"`, `"paypal"`, `"creditCard"`) and the payload keys (`cash`, `paypal`, `creditCard`) are the same word now, on purpose, not two vocabularies for the same case that happen to need aligning.

That symmetry is what reading the union looks like afterward: `method.cash`, `method.paypal.email`, `method.creditCard.cardNumber`. `method.creditCard` is a single value, every field belonging to the credit card case, grouped under one name, and nothing else. Neither the flat version nor the boxed one has an equivalent: the flat version scatters `cardNumber`, `expiryDate`, and `cvv` across `method` itself, related to each other only by convention; the boxed version groups them but under a name, `value`, that isn't about the credit card at all. A function that wants the card's data can be passed `method.creditCard` directly; the same function working against either alternative has to be passed all of `method` and either pick fields off it or trust that `.value` means what it meant last time you checked `.tag`.

This only works because the tag is a string. Whatever discriminates the union has to double as the payload's key, and a key has to be a string (or symbol) to begin with. A boolean can't be reused as a name the way `"cash"` and `"paypal"` already are the words for what they name. So the string requirement isn't a restriction bolted on afterward; it falls directly out of wanting the tag value and the payload key to be the same thing. [Result](#result), below, runs into this from the other direction: the usual `{ ok: true }` discriminant can't take this fix at all.

This union is completely determined by one thing: a mapping from case name to payload type. Write that mapping directly, and the whole union (tag, payload key, and all) is generated from it. `Sum<Cases>` is exactly this, generalized, and `variant(shape)` builds one member of it from a single `{ tag: payload }` pair:

```typescript
import { variant, unit, type Sum, type Unit } from "ts-sumtype";

type PaymentMethod = Sum<{
  cash: CashPayment;
  paypal: PayPalPayment;
  creditCard: CreditCardPayment;
}>;

variant({ paypal: { email: "a@b.com" } });
// { tag: "paypal", paypal: { email: "a@b.com" } }

variant({ cash: unit });
// { tag: "cash", cash: null }
```

`CashPayment` had no fields to begin with, `cash: unit` is the same case with no payload, the key is always present in the record.

Whether that "nothing to store" is really nothing is worth pinning down, because TypeScript makes it easy to fake a case with no payload using a plain string, and that's a narrower move than it looks. A crypto payment's currency, done the ordinary way, is a string literal union:

```typescript
type Currency = "Bitcoin" | "Ethereum" | "Solana";

function networkFeeSats(currency: Currency): number {
  if (currency === "Bitcoin") return 0;
  // ...
}
```

Say bitcoin later needs its own data, a network (mainnet vs testnet), say. `currency` can no longer be a bare string once one of its members needs a payload, so it becomes `{ tag: "bitcoin", network: Network } | "Ethereum" | "Solana"` or some other reshaping, and every existing `currency === "Bitcoin"` becomes `currency.tag === "bitcoin"` (or worse, a mix, depending on which member you're checking). The code that already worked, that never asked to change, has to change anyway, that's extension forcing modification, not being open to it.

It's tempting to read the literal-union version as a discriminated union with no payload, interchangeable with the tagged version until a payload shows up. It isn't. TypeScript narrows `currency === "Bitcoin"` and `currency.tag === "bitcoin"` by the same control-flow analysis, and both give you exhaustiveness in a `switch`, so they look like two spellings of the same thing. But the literal union narrows because the *value itself* is the discriminant, with nowhere to put a payload; the tagged version narrows because the discriminant is a *field*, separate from a payload slot that's already sitting there. They only look interchangeable in the case that has no data yet, which is precisely the case that can't tell you whether it's ever going to need any. Modeling every case through `Sum`, even the ones you're confident will stay empty, means there's no separate representation to fall out of, extending a case is always additive, never a reshape, because the slot was always there:

```typescript
type Currency = Sum<{
  bitcoin: Unit;
  ethereum: Unit;
  solana: Unit;
}>;

variant({ bitcoin: unit });
// { tag: "bitcoin", bitcoin: null }
```

A `Sum` is a whole state you can hold in one variable, pass, and return; a case's payload can itself be another `Sum`, the same way `Currency` sits inside `crypto`:

```typescript
type PaymentMethod = Sum<{
  cash: Unit;
  paypal: { email: string };
  creditCard: {
    cardNumber: string;
    expiryDate: string;
    cvv: number;
  };
  crypto: {
    address: string;
    currency: Currency;
  };
}>;
```

Splitting a sum type into a union of its parts doesn't change it: `Sum<{ a: X; b: Y }>` and `Sum<{ a: X }> | Sum<{ b: Y }>` are the same type. `Ok`, `Some`, `Err`, and `None`, met below, are declared this way (individually, then joined with `|`) since they're discovered one at a time rather than known as a single table upfront.

---

## Unit

`Unit`, used above for `cash`, `bitcoin`, `ethereum`, and `solana`, isn't a type this library invented, it's `null`, under a name that says what it's for. `null` isn't a placeholder for "payload not implemented yet", it's the correct type for "no data": type theory calls a type with exactly one possible value a *unit type*, `null` has exactly one value, `null` itself, so it already was one before anything here named it. This is a different question from optionality: whether a case carries data is `Unit`, whether a value is present at all is [`Option<T>`](#option), and the two don't overlap, `Option<Unit>` (present-but-empty vs. absent) is a coherent type distinct from `Unit` alone.

TypeScript actually has two candidate unit types, `null` and `undefined`, and either would type-check here, but they behave differently once JSON is involved: `JSON.stringify({ bitcoin: undefined })` drops the key (`"{}"`), `JSON.stringify({ bitcoin: null })` keeps it (`'{"bitcoin":null}'`). A case's payload key is supposed to always be present, so `undefined`'s asymmetric handling would silently break that on the wire; `null` doesn't have that failure mode, which is why it's the one used throughout, not an arbitrary pick between two otherwise-equivalent options.

`Unit` and `unit` name that choice explicitly instead of leaving it implicit in a bare `null`:

```typescript
export type Unit = null;
export const unit: Unit = null;
```

`Sum<{ bitcoin: null }>` and `Sum<{ bitcoin: Unit }>` are the same type, `null` and `unit` the same value, so either spelling is accepted anywhere the other is; `null`/`variant({ bitcoin: null })` still work everywhere, `Unit`/`unit` exist for when spelling out the intent is worth the extra word, which is the spelling the rest of this README uses from here on.

---

## Frozen

`Sum` marks the tag and the payload slot `readonly`, so `term.seq = y` does not type check -- a payload is replaced by building a new case, which is what `withPayload(term, next)` does. It stops there: `term.seq.left = x` type checks, and `term.kids.push(x)` does too. `Frozen<T>` marks every property `readonly` and every collection immutable, all the way down. Wrap the sum type with it:

```typescript
import { type Frozen, type Sum, type Unit } from "ts-sumtype";

type Term = Frozen<Sum<{
  id: Unit;
  seq: { left: Term; right: Term };
  kids: Term[];
  table: Record<string, Term>;
}>>;

declare const term: Term;
if (term.tag === "seq") {
  term.seq.left = term;                   // Cannot assign to 'left' because it is a read-only property
  term.seq = { left: term, right: term }; // Cannot assign to 'seq' because it is a read-only property
}
if (term.tag === "kids") {
  term.kids.push(term);                   // Property 'push' does not exist on type 'FrozenArray<Term>'
}
if (term.tag === "table") {
  term.table["k"] = term;                 // Index signature only permits reading
}
```

Writing `readonly` by hand covers a payload's own fields, one at a time. `Frozen` covers them all at once, along with everything inside a container like `table` and every collection reached on the way down. It applies to a sum type you already have, so `Frozen<Option<Row>>` and `Frozen<Result<Row, GatewayErr>>` work the same way.

Construction is unchanged, since TypeScript ignores `readonly` when comparing object types: `variant({ seq: { left, right } })` still builds a `Term`. Arrays are the exception it does check, and the one thing to plan for: `kids` is a `readonly Term[]`, so a function declaring `Term[]` needs `readonly Term[]` or a copy at the call site. Primitives, functions, `Date`, `RegExp`, `Error`, and `Promise` pass through whole; tuples keep their positions; `Map` and `Set` become `ReadonlyMap` and `ReadonlySet`.

A case referring back to the type being declared is fine, the way `seq` and `kids` do above. A recursive type declared elsewhere is not: `Frozen<Json>` freezes the outer layer and leaves every `Json` inside it mutable, and a function recursing over such a payload stops type checking partway down. Declare those frozen instead, either with the markers written out:

```typescript
type Json = null | boolean | number | string | readonly Json[] | { readonly [k: string]: Json };
```

or as a `Sum` of their cases, where the self-reference sits inside the case literal:

```typescript
type Json = Frozen<Sum<{
  nul: Unit; bool: boolean; num: number; str: string;
  arr: Json[]; obj: Record<string, Json>;
}>>;
```

`readonly` is erased at compile time. `Frozen` adds no `Object.freeze` and no copying, and it governs direct writes only.

---

## Reading a variant

You read a variant with `.tag` and the tag-named payload key, and a check on the tag narrows the union to one case, after which that case's key is reachable:

```typescript
function processorFee(method: PaymentMethod): number {
  if (method.tag === "creditCard") {
    return method.creditCard.cardNumber.startsWith("3") ? 0.035 : 0.024; // Amex costs more to process than Visa/Mastercard
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

A variant serializes as-is, no `toJSON`, no revival step, and the payload key survives even when there's nothing in it:

```typescript
JSON.stringify(variant({ paypal: { email: "a@b.com" } }));
// {"tag":"paypal","paypal":{"email":"a@b.com"}}

JSON.stringify(variant({ cash: unit }));
// {"tag":"cash","cash":null}
```

---

## isVariant

A tag check reads one case; some code needs to ask about several at once, which methods refund instantly versus which need manual review, say. `isVariant(v, ...tags)` is a type guard: it's true when `v`'s tag is one of the tags you pass, and it narrows `v` accordingly. Pass one tag to test one case, or several to match **any** of them:

```typescript
import { isVariant } from "ts-sumtype";

// one tag, narrows to that case
const isCreditCard = (m: PaymentMethod) => isVariant(m, "creditCard");

// several tags, matches any (logical OR), with no `.tag === "a" || .tag === "b"`
const isInstantRefund = (m: PaymentMethod) => isVariant(m, "cash", "creditCard");
```

Every tag is checked against `v`'s own tags, so a typo is a compile error. Because it narrows both branches, it reads naturally as an early-return guard, the negated form narrows the *rest* of the function to everything the guard excluded:

```typescript
type Muted = Sum<{
  off: Unit;
  temporary: { until: Date };
  forever: Unit;
}>;

function isMutedNow(m: Muted): boolean {
  if (isVariant(m, "off")) return false;
  if (isVariant(m, "forever")) return true;
  return m.temporary.until > new Date();   // m is narrowed to the temporary case
}
```

`isVariant` is the general form of the per-type guards you'll meet below, `isOk`, `isSome`, `isNone`, `isErr` are the same guard fixed to one tag. It works on any `{ tag }`-shaped value, including a plain `.tag === "x"` you could write by hand; reach for it when you want the OR form, a reusable predicate (`methods.filter((m) => isVariant(m, "crypto"))`), or simply one consistent spelling.

---

## matchTag

A tag check reads one case. `matchTag` handles them all at once, one branch per tag. Each branch is either a **function arm** that receives the payload, or a **value arm** returned as-is:

```typescript
import { matchTag } from "ts-sumtype";

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

When a payload didn't arrive shaped as a `Sum` case at all, see [Adapting existing data](#adapting-existing-data).

---

## Result

Another common pattern for a value that's either a success or a failure is a boolean discriminant:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

This is the boxed shape rejected back in [Sum](#sum), with the same cost: `value` and `error` are generic slots, not names, so there's nothing to read symmetrically the way `method.creditCard` does. It also can't take the fix `PaymentMethod` took instead: `true` and `false` aren't strings, so they can't double as their own payload's key the way `"cash"` and `"paypal"` do. `Result<T, E>` is `Ok<T> | Err<E>` instead: two string-tagged cases, built from the same `Sum` convention as everything else. The success case keeps the word `ok`, it just becomes a string tag instead of a boolean field, which is exactly what lets it double as its own payload's key: `value` becomes `.ok`, `error` becomes `.error`, each reachable by its own name instead of a shared placeholder. `ok(value)` builds the success case directly; `errVariant(shape)` builds the failure case with its own payload tagged too, so when several errors can occur they stay discriminable by their inner tag (more on the plain `err(payload)` it's built from, below):

```typescript
import { ok, errVariant, unit, type Result } from "ts-sumtype";

type Receipt = { id: string };

type GatewayErr = Sum<{
  declined: { reason: string };
  timeout: Unit;
}>;

function chargeGateway(
  method: PaymentMethod,
  cents: number,
): Result<Receipt, GatewayErr> {
  const response = sendChargeRequest(method, cents); // POSTs to the gateway, returns { status, body }

  if (response.status === 402) {
    return errVariant({
      declined: { reason: response.body.reason },
    });
  }
  if (response.status === 504) {
    return errVariant({ timeout: unit });
  }
  return ok({ id: response.body.receiptId });
}

const v = chargeGateway(method, 500);
if (v.tag === "error") {
  report(v.error); // v is Err<GatewayErr> here
} else {
  confirm(v.ok); // v is Ok<Receipt> here
}
```

Operations on a `Result` are free functions, `unwrap(r)`, not `r.unwrap()`, and the value is a plain union, so `console.log`, `JSON.stringify`, and `switch` work on it directly. Because a guard narrows the union and hands you the error branch to forward as-is, **early return is the default control-flow style**, the same as any other variant.

The rest of this README leans on a second `Result`-returning step alongside `chargeGateway`: `authorizeMethod`, which checks with the card network that a method is chargeable before it's actually charged:

```typescript
type AuthorizeErr = Sum<{
  declined: { reason: string };
  unreachable: { status: number };
}>;

declare function authorizeMethod(
  method: PaymentMethod,
): Result<PaymentMethod, AuthorizeErr>;
```

### Errors carry their own tag

`errVariant` builds an error whose payload is itself a tagged variant, so when several errors can occur they stay discriminable by their inner tag, `chargeGateway`'s own `declined` case, from above:

```typescript
errVariant({ declined: { reason: "insufficient_funds" } });
// { tag: "error", error: { tag: "declined", declined: { reason: "insufficient_funds" } } }
```

`errVariant` is `tagged("error")`, a constructor pre-nested under one outer tag. Build your own the same way when a case needs a taxonomy of its own: here, `declined`'s free-text `reason` becomes its own discriminable tag instead of a string you'd have to switch on by hand:

```typescript
import { tagged } from "ts-sumtype";

const declined = tagged("error", "declined");
declined({ insufficientFunds: { available: 420 } });
// { tag: "error", error: { tag: "declined", declined: { tag: "insufficientFunds", insufficientFunds: { available: 420 } } } }

declined({ stolenCard: unit });
// { tag: "error", error: { tag: "declined", declined: { tag: "stolenCard", stolenCard: null } } }
```

`declined(...)`'s result type nests one level deeper than the flat `declined: { reason: string }` on `GatewayErr`, matching the extra `"declined"` prefix:

```typescript
type DeclinedErr = Sum<{
  declined: Sum<{
    insufficientFunds: { available: number };
    stolenCard: Unit;
  }>;
}>;
```

`errVariant` is sugar over two calls: `errVariant({ declined: {...} })` is `err(variant({ declined: {...} }))`. When the error has no tag of its own (a caught `unknown`, a bare sentinel, or a value that's already built), skip the tagging and construct it directly with `err(payload)`, the same way `ok(value)` builds the success case:

```typescript
err(caught); // { tag: "error", error: caught }: whatever caught is, stored as-is
```

### Functions on Result

| Function | Result |
|---|---|
| `ok(value)` | `Ok<T>` |
| `err(payload)` | `Err<E>` |
| `errVariant({ tag: payload })` | `Err<Sum<{ tag: payload }>>` |
| `isOk(r)` / `isErr(r)` | type guards |
| `fromThrowable(f, mapError?)` | runs `f`, catching a throw into `Err` |
| `allErrors(results)` | one `Ok` of every value, or an `Err` collecting **every** error |
| `toOption(r)` | `Ok → Some`, `Err → None` |

`allErrors` gathers all failures. When you want to stop at the first one instead, use [`allResults`](#collecting-results).

---

## Option

`Option<T>` is `Some<T> | None`, a value that may be absent, the same two cases Rust's `Option` has. Build the present case with `some`, the absent case with `none`. Because an `Option<T>` is a different type from `T`, absence is part of the type, so the compiler makes you account for it. Not every customer has a saved payment method:

```typescript
import { some, none, isSome, type Option } from "ts-sumtype";

type Customer = {
  id: string;
  email: string;
  savedMethod: Option<PaymentMethod>;
};

const c: Customer = loadCustomer(id);
if (isSome(c.savedMethod)) charge(c.savedMethod.some, cents); // some's payload is a PaymentMethod
```

`none()` returns a fresh object each call, so compare it by tag (`isNone(o)` or `o.tag === "none"`), never with `===`.

| Function | Result |
|---|---|
| `some(value)` / `none()` | `Some<T>` / `None` |
| `isSome(o)` / `isNone(o)` | type guards |
| `someOr(o, error)` | `Some → Ok`, `None → Err(error)` |

---

## Working across Result and Option

`unwrap`, `unwrapOr`, and `expect` work on a `Result` or an `Option` under one name each, the same way Rust's `Option` and `Result` both happen to have a `.unwrap()`: they check for either success tag, `ok` or `some`, at runtime, so the same function reads whichever one you hand it:

```typescript
import { unwrap, unwrapOr, expect, fromNullable } from "ts-sumtype";

unwrap(authorizeMethod(method));   // PaymentMethod    (Ok → value)
unwrap(c.savedMethod);             // PaymentMethod, or throws if none saved

unwrapOr(authorizeMethod(method), variant({ cash: unit }));  // the authorized method, or cash if it was declined
unwrapOr(c.savedMethod, variant({ cash: unit }));             // the saved method, or cash as a default

expect(c.savedMethod, "no saved payment method"); // PaymentMethod, or throws Error("no saved payment method")
```

`fromNullable` reads its arity: one argument produces an `Option`, two produce a `Result` with the second as the error. A customer record arriving from the network with a nullable field is the natural source:

```typescript
fromNullable(raw.savedMethod);           // Option<PaymentMethod>
fromNullable(raw.savedMethod, "no method"); // Result<PaymentMethod, "no method">
```

### Collecting results

`allResults` walks an array of `Result`s, and `allOptions` walks an array of `Option`s, each returning the tuple of values or short-circuiting on the first `Err`/`None` found:

```typescript
import { allResults, allOptions } from "ts-sumtype";

allResults([authorizeMethod(a), authorizeMethod(b)]);      // Ok<[PaymentMethod, PaymentMethod]>
allResults([authorizeMethod(a), authorizeMethod(bad)]);    // Err, stops at the first declined method

allOptions([customerA.savedMethod, customerB.savedMethod]); // Some<[PaymentMethod, PaymentMethod]>
allOptions([customerA.savedMethod, noMethod.savedMethod]);  // None, stops at the first absent method
```

### pipeResult / pipeOption

`allResults`/`allOptions` collect a fixed array of independent `Result`s/`Option`s. The other common shape is a *sequence*: each step depends on the previous one's success value, and any step failing should stop the rest from running. `pipeResult(value, ...fns)` threads `value` through each function left to right, feeding each one the previous step's unwrapped `ok`; a step returning `error` halts the pipe immediately, returned as-is, and the remaining functions never run:

```typescript
import { pipeResult } from "ts-sumtype";

pipeResult(
  authorizeMethod(method),          // Result<PaymentMethod, AuthorizeErr>
  (m) => chargeGateway(m, cents),   // Result<Receipt, GatewayErr>
  (r) => confirmReceipt(r),         // Result<Confirmation, ConfirmErr>
);
// Result<Confirmation, AuthorizeErr | GatewayErr | ConfirmErr>
```

`pipeOption(value, ...fns)` is the same shape over `Option`, halting on `none` instead of `error`:

```typescript
import { pipeOption } from "ts-sumtype";

pipeOption(
  raw.savedMethod,                  // Option<PaymentMethod>
  (m) => lookupNickname(m),         // Option<string>
);
// Option<string>
```

`value` itself doesn't have to already be wrapped, and neither does a step's return: a plain value (not a `Result`/`Option`) is passed straight through to the next step and can never halt. That's useful for a pure transform in the middle of a pipe, `(m) => m.id` say, without wrapping it in `ok(...)`/`some(...)` just to satisfy the types:

```typescript
pipeResult(raw, (r) => authorizeMethod(r.method), (m) => m.id, (id) => chargeGateway(id, cents));
```

`pipeResult` always returns a `Result`, `pipeOption` always returns an `Option`, no exceptions: if the *last* step (or a zero-step `value`) is a plain value rather than one of these, it's wrapped in `ok(...)`/`some(...)`, so `pipeResult(raw, (r) => r.id)` is a `Result<string, never>`, not a bare `string`, and `pipeResult(5)` is `Ok<5>`.

Each step's parameter type is checked against the previous step's declared return type, so feeding a step the wrong shape is a compile error at that step. Both functions support up to 8 steps. A `pipeResult` step can't return an `Option` (or a `pipeOption` step a `Result`); convert at the boundary with [`someOr`](#option)/[`toOption`](#functions-on-result) between two separate calls.

---

## Adapting existing data

A sum type is a tag and a payload. Some data carries exactly that, a case and its fields, but under a different spelling: a flat discriminated union, a union keyed by other names, a bare string-literal enum. `fromFlat`, `fromKeyed`, and `fromEnum` rewrite each into a `Sum` case, once, where the data enters your program.

### fromFlat

A flat discriminated union, one object per case, keyed by a shared field, is the shape this README opened with, and it's also the shape a payment gateway's webhook actually sends:

```typescript
type RawEvent =
  | { kind: "cash" }
  | { kind: "paypal"; email: string }
  | {
      kind: "creditCard";
      cardNumber: string;
      expiryDate: string;
      cvv: number;
    };
```

`fromFlat(key)` returns a converter that moves every key but the discriminant under the tag-named key:

```typescript
import { fromFlat } from "ts-sumtype";

fromFlat("kind")({ kind: "paypal", email: "a@b.com" });
// { tag: "paypal", paypal: { email: "a@b.com" } }
```

Passed a whole union value, it distributes member-by-member, so the result type is the full `Sum<{ cash: {} }> | Sum<{ paypal: {...} }> | Sum<{ creditCard: {...} }>` union, not one closed `Sum` table, because `fromFlat` isn't working from a table you wrote; it's converting a union you don't control, one member at a time.

The converter is reusable, which is the point of currying on `key` instead of taking it alongside the value; it drops straight into `.map` for a whole array:

```typescript
const events: RawEvent[] = await fetchEvents();
events.map(fromFlat("kind"));
// [{ tag: "cash", cash: {} }, { tag: "paypal", paypal: { email: "a@b.com" } }, ...]
```

### fromKeyed

Some data is already nested, just under different key names than `tag` and the payload, a gateway that groups every case's fields under one `details` object, say:

```typescript
type RawEvent =
  | {
      type: "creditCard";
      details: {
        cardNumber: string;
        expiryDate: string;
        cvv: number;
      };
    }
  | { type: "paypal"; details: { email: string } };
```

`fromKeyed(tagKey, payloadKey)` returns a converter that renames rather than flattens:

```typescript
import { fromKeyed } from "ts-sumtype";

fromKeyed("type", "details")({ type: "paypal", details: { email: "a@b.com" } });
// { tag: "paypal", paypal: { email: "a@b.com" } }
```

Same reusable-converter shape as `fromFlat`: the two key names are the fixed configuration, curried together since they're always supplied as a pair:

```typescript
const events: RawEvent[] = await fetchEvents();
events.map(fromKeyed("type", "details"));
```

### fromEnum

A bare string-literal union, a currency arriving as `"bitcoin" | "ethereum" | "solana"` from a source you don't control, becomes its `Sum` case with a `Unit` payload:

```typescript
import { fromEnum } from "ts-sumtype";

fromEnum("bitcoin"); // { tag: "bitcoin", bitcoin: null }
```

This is the same representation this README argued against building new code around, back in [Sum](#sum), useful at a boundary you don't control, not as the shape to reach for when you do. Unlike `variant`, which expects a single-key object and can't be pointed at a bare string, `fromEnum` takes the string directly, so `arr.map(fromEnum)` converts every element, ignoring the extra index/array arguments `.map` passes along.

---

## Notes

- **The payload key is named after the tag, and always present.** `{ tag: "cash" }` alone does not satisfy `Sum<{ cash: Unit }>`, write `variant({ cash: unit })` or `{ tag: "cash", cash: null }`.
- **`"tag"` is a reserved case name.** Its payload key would collide with the discriminant, so `Sum<{ tag: T }>` intersects the discriminant with `T` on the same field; for most `T` that leaves `tag` uninhabitable. Pick any other case name.
- **Variance is covariant.** `Result<Receipt, never>` is assignable to `Result<Receipt, GatewayErr>`; the reverse (narrowing) is a type error.
- **`Frozen` reaches one unrolling of a recursive type.** `Frozen<Sum<{ ... }>>` at a declaration is frozen all the way down; `Frozen<SomeRecursiveTypeDeclaredElsewhere>` leaves that type's inner occurrences mutable, see [Frozen](#frozen).
- **Payloads must be JSON-safe** to survive a `JSON.stringify` / `JSON.parse` round-trip: functions, symbols, and `bigint` don't survive it, and neither does `undefined`, which is silently dropped from whatever key holds it. That last one is why empty payloads are typed `Unit`/`null` rather than `undefined`, see [Unit](#unit).
- **A `const` whose initializer is narrower than its declared type** can confuse overload resolution at a generic call site:

  ```typescript
  const cached: Result<number, GatewayErr> = errVariant({ declined: { reason: "insufficient_funds" } });
  unwrapOr(cached, 0); // may fail: the generic is inferred from the construction site
  ```

  Give an explicit type argument (`unwrapOr<Result<number, GatewayErr>>(cached, 0)`), or let a function's declared return type produce the value, which is how ordinary code reads, since signatures name the sum type.

---

## Entry points

The root export re-exports everything. Each module is also individually importable:

```ts
import { ok } from "ts-sumtype/result";
import { matchTag } from "ts-sumtype/match";
```

`ts-sumtype/variant`, `/match`, `/result`, `/option`, `/unwrap`, `/adapt`, `/pipe`.

---

## License

MIT
