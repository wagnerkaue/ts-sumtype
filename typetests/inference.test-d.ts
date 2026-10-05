import {
  variant, tagged, type Sum, type Unit, type Frozen, type NestVariant, type PayloadOf,
  ok, err, errVariant, isOk, isErr, fromThrowable, toOption,
  mapError, wrapError,
  flow, tryFlow, step, lazy, prepend, rejectWith, rejectIf, tryReduce, tryMap, tryFlatMap, type Fallible,
  tryOver, over, match, tryMatch, r,
  type Ok, type Err, type Result, type At, type Wrapped, type Located,
  some, none, isSome, isNone, someOr,
  type Some, type None, type Option,
  unwrap, unwrapOr, expect, fromNullable,
  fromFlat, fromKeyed, fromEnum, type Unflattened, type Rekeyed,
} from "../src/index";

// ── T1: Sum basics -- a single case is just Sum with one key
type Idle = Sum<{ idle: null }>;
declare const idle: Idle;
const idlePayload: null = idle.idle;
// @ts-expect-error tag-named payload key must be present even for unit cases
const badIdle: Idle = { tag: "idle" };

// ── T2: Result construction & narrowing
const r1: Result<number, string> = ok(1);
const r2: Result<number, never> = ok(2);
const r2widen: Result<number, string> = r2; // covariant widening

declare const r3: Result<number, string>;
function earlyReturn(): number {
  if (r3.tag === "error") return -1; // native narrowing, zero methods
  return r3.ok;
}
function earlyReturnGuard(): number {
  if (isErr(r3)) return -1;
  return r3.ok; // narrowed via isErr
}

// ── T3: err(payload) mirrors ok(value) -- no shape constraint; errVariant(tag, payload) is err(variant(tag, payload))
const rawErr = err({ http: "declined", extra: 1 }); // any payload, stored as-is
const rawErrProbe: Sum<{ error: { http: string; extra: number } }> = rawErr;

type ParseErr = Sum<{ parse: { input: string } }>;
const parseErr = errVariant("parse", { input: "x" });
const parseErrProbe: Sum<{ error: ParseErr }> = parseErr;
const unitErr = errVariant("timeout", null);
const unitErrProbe: Sum<{ error: Sum<{ timeout: null }> }> = unitErr;
// @ts-expect-error the tag is an argument, so an object is not one
const badTagged = errVariant({ http: "declined", extra: 1 });
// Returns `Err<…>` itself, so it is assignable to a `Result` whose error type is still generic.
const wrapGeneric = <T, E, const K extends string>(r: Result<T, E>, tag: K): Result<T, Sum<Record<K, E>>> =>
  isOk(r) ? r : errVariant(tag, r.error);

// ── T4: fromThrowable / toOption
const t4a = fromThrowable(() => 1);
const t4aProbe: Result<number, unknown> = t4a;
const t4b = fromThrowable(
  () => { throw new Error("x"); },
  (e): ParseErr => variant("parse", { input: String(e) }),
);
const t4bProbe: Result<never, ParseErr> = t4b;

const t4d = toOption(ok(1));
const t4dProbe: Option<number> = t4d;

// ── T5: Option construction & narrowing (present case is Some<T>)
const o1: Option<string> = some("x");
const o2: Option<string> = none();
declare const o3: Option<number>;
if (isSome(o3)) {
  const v: number = o3.some;
}
const converted = someOr(some(1), "missing");
const convertedProbe: Result<number, string> = converted;

// ── T6: unwrap, unwrapOr and expect take a `Result`. An `Option` reaches them through `someOr`,
// which is where the absence gets the reason the throw reports.
const u1 = unwrap(ok(1) as Result<number, string>);
const u1Probe: number = u1;
const u2 = unwrap(someOr(some(1) as Option<number>, "missing"));
const u2Probe: number = u2;

declare const flatErrResult2: Result<number, string>;
const uo1 = unwrapOr(flatErrResult2, 0);
const uo2 = unwrapOr(someOr(none<number>(), "missing"), 0);

const ex1 = expect(ok(1) as Result<number, string>, "msg");
const ex2 = expect(someOr(some(1) as Option<number>, "missing"), "msg");

// @ts-expect-error an Option has no error payload to report, so it is not unwrappable directly
unwrap(some(1) as Option<number>);

const fn1 = fromNullable("x");
const fn1Probe: Option<string> = fn1;
const fn2 = fromNullable("x", "was null" as const);
const fn2Probe: Result<string, "was null"> = fn2;

// ── T7: tagged() nesting
const nested = tagged("a", "b")("c", { x: 1 });
type Nested = NestVariant<["a", "b"], Sum<{ c: { x: number } }>>;
const nestedProbe: Nested = nested;

// ── T8: a declared return type makes a switch over the tag exhaustive: omitting a case leaves a
// path with no return, which the annotation rejects.
type Action = Sum<{ go: { n: number }; stop: null }>;
declare const action: Action;
function advance(a: Action): number {
  switch (a.tag) {
    case "go":
      return a.go.n;
    case "stop":
      return -1;
  }
}
const m1Probe: number = advance(action);

// ── T9: multi-step Result/Option composition via early-return. The return type is the union of
// every branch's outcome, one sum type at a time; T12 covers that same shape through
// tryFlow.
type NotFoundErr = Sum<{ not_found: { id: number } }>;
declare function parseId(s: string): Result<number, ParseErr>;
declare function findUser(id: number): Result<{ name: string }, NotFoundErr>;
declare function nicknameOf(u: { name: string }): Option<string>;

function mixedEarlyReturn(s: string): Some<string> | Err<ParseErr> | Err<NotFoundErr> | None {
  const id = parseId(s);
  if (isErr(id)) return id;
  const user = findUser(id.ok);
  if (isErr(user)) return user;
  return nicknameOf(user.ok); // Option<string>, flows straight into the return union
}

// ── T10: adapt -- fromFlat / fromKeyed / fromEnum
type FlatEvent =
  | { type: "video"; duration: number; size: number }
  | { type: "message"; text: string };
type UnflatEvent = Sum<{ video: { duration: number; size: number } }> | Sum<{ message: { text: string } }>;

declare const flatEvent: FlatEvent;
const unflat = fromFlat("type")(flatEvent);
const unflatProbe: UnflatEvent = unflat;
const unflatTypeProbe: Unflattened<"type", FlatEvent> = unflatProbe;

// @ts-expect-error discriminant value must be a string
fromFlat("type")({ type: 1 });

type NestedEvent =
  | { kind: "video"; data: { duration: number } }
  | { kind: "message"; data: { text: string } };
type RekeyedEvent = Sum<{ video: { duration: number } }> | Sum<{ message: { text: string } }>;

declare const nestedEvent: NestedEvent;
const rekeyed = fromKeyed("kind", "data")(nestedEvent);
const rekeyedProbe: RekeyedEvent = rekeyed;
const rekeyedTypeProbe: Rekeyed<"kind", "data", NestedEvent> = rekeyedProbe;

type Status = "active" | "pending" | "inactive";
declare const status: Status;
const statusVariant = fromEnum(status);
const statusProbe: Sum<{ active: null }> | Sum<{ pending: null }> | Sum<{ inactive: null }> = statusVariant;
if (statusVariant.tag === "active") {
  const activePayload: null = statusVariant.active;
  // @ts-expect-error fromEnum distributes over its argument's union, so narrowing to
  // "active" rules out the other cases' keys entirely
  const crossCase = statusVariant.pending;
}

// ── T11: recursive self-reference
type Expr = Sum<{ num: number; paren: Expr }>;
declare const expr: Expr;
if (expr.tag === "paren") {
  const inner: Expr = expr.paren;
}
function evalExpr(e: Expr): number {
  switch (e.tag) {
    case "num":
      return e.num;
    case "paren":
      return evalExpr(e.paren);
  }
}
const builtExpr: Expr = variant("paren", variant("num", 1));

// the tag is its own argument, so arity carries the one-case rule and an object is rejected
// against `string` rather than by a constraint
// @ts-expect-error an object is not a tag
const badVariant = variant({ a: 1, b: 2 });
// @ts-expect-error a case takes one payload
const extraArg = variant("a", 1, 2);

// Sum<{ a: X; b: Y }> and Sum<{ a: X }> | Sum<{ b: Y }> are the same type --
// a whole table fanned out in one call, or individually-declared cases joined with `|`
type Fanned = Sum<{ a: number; b: string }>;
type Joined = Sum<{ a: number }> | Sum<{ b: string }>;
const fannedAsJoined: Joined = variant("a", 1) as Fanned;
const joinedAsFanned: Fanned = variant("b", "x") as Joined;

// ── T12: tryFlow: the two Result steps from T9, composed instead of early-returned
declare function chargeGateway(id: number, cents: number): Result<{ receiptId: string }, ParseErr>;
const p1 = tryFlow(parseId, findUser);
const p1Probe: Fallible<string, { name: string }, ParseErr | NotFoundErr> = p1;

const p2: Fallible<string, { receiptId: string }, ParseErr> = tryFlow(parseId, (id) => chargeGateway(id, 500));

// a plain function joins through step, mixed with a fallible one
const p3: Fallible<number, number, "negative"> = tryFlow(
  step((n) => n + 1),
  (n) => (n > 0 ? ok(n) : err("negative")),
);

// tryFlow composes steps whose types are still generic: inverting an isomorphism builds a step out
// of two it was handed
type Isomorphism<A, B, K> = {
  canon: (a: A) => Result<K, string>;
  do: (a: A) => Result<B, string>;
  undo: (b: B) => Result<A, string>;
};
function inverse<A, B, K>(i: Isomorphism<A, B, K>): Isomorphism<B, A, K> {
  return {
    canon: tryFlow(i.undo, i.canon),
    do: i.undo,
    undo: i.do,
  };
}

// ── T13: Frozen -- payloads and the slots holding them, immutable with nothing annotated
type Term = Frozen<Sum<{
  id: Unit;
  seq: { left: Term; right: Term };
  kids: Term[];
  table: Record<string, Term>;
  span: [number, number];
  render: (t: Term) => string;
  stamp: Date;
}>>;
declare const term: Term;

if (term.tag === "seq") {
  // @ts-expect-error the payload's own fields are readonly
  term.seq.left = term;
  // @ts-expect-error and so is the slot holding the payload
  term.seq = { left: term, right: term };
}
if (term.tag === "kids") {
  // @ts-expect-error arrays become readonly arrays
  term.kids.push(term);
}
if (term.tag === "table") {
  // @ts-expect-error a container reached through a payload is frozen at every depth
  term.table["k"] = term;
}

// tuples keep their positions, call signatures stay callable, built-ins pass through whole
if (term.tag === "span") {
  const spanStart: number = term.span[0];
  const spanEnd: number = term.span[1];
  const spanArity: 2 = term.span.length;
}
if (term.tag === "render") {
  const rendered: string = term.render(term);
}
if (term.tag === "stamp") {
  const stamped: Date = term.stamp;
}

// construction reads the same: a mutable literal is assignable to a frozen payload
const builtTerm: Term = variant("seq", { left: variant("id", null), right: variant("id", null) });

// `Frozen<Term>` is `Term`, so a recursive traversal over a frozen ADT still type checks
function countTerms(t: Term): number {
  switch (t.tag) {
    case "seq":
      return countTerms(t.seq.left) + countTerms(t.seq.right);
    case "kids":
      return t.kids.reduce((n, x) => n + countTerms(x), 0);
    case "table":
      return Object.values(t.table).reduce((n, x) => n + countTerms(x), 0);
    default:
      return 1;
  }
}

// Frozen applies to a sum type that already exists, not only to one being declared here
declare const frozenOption: Frozen<Option<{ rows: number[] }>>;
if (frozenOption.tag === "some") {
  const rowCount: number = frozenOption.some.rows.length;
  // @ts-expect-error the payload of an existing Option is frozen through it
  frozenOption.some.rows.push(1);
}

// the two nesting orders describe the same type
type OuterFrozen = Frozen<Sum<{ go: { n: number }; stop: Unit }>>;
type InnerFrozen = Sum<Frozen<{ go: { n: number }; stop: Unit }>>;
declare const outerFrozen: OuterFrozen;
declare const innerFrozen: InnerFrozen;
const outerAsInner: InnerFrozen = outerFrozen;
const innerAsOuter: OuterFrozen = innerFrozen;

// ── T14: an infallible Result has no error case -- `Result<T, never>` is just `Ok<T>`,
// so the success payload is reachable without narrowing first.
function infallible(x: number): Result<number, never> {
  return ok(x);
}
const infallibleValue: number = infallible(5).ok;

// a chain of steps that can't fail reads the same way
const flowValue: string = tryFlow(step((r: { id: string }) => r.id))({ id: "x" }).ok;

// the collapse must not leak into a generic `E`: a function still building a `Result<T, E>`
// for an unresolved `E` accepts `err(...)` with no assertion at the construction site.
type Pair<X, EX, Y, EY> = { forward: Fallible<X, Y, EX>; backward: Fallible<Y, X, EY> };
type Leg<A, EA, B, EB, E> = {
  pair: Pair<A, EA, B, EB>;
  mapDomErr: (domErr: EA) => E;
  mapCodErr: (codErr: EB) => E;
};

const t14Identity: Pair<number, never, number, never> = { forward: ok, backward: ok };
const t14IdentityValue: number = t14Identity.forward(5).ok;

function t14Compose<X, EX, Y, EY, Z, EZ, EIn, EOut>(
  xy: Leg<X, EX, Y, EY, EIn>,
  yz: Leg<Y, EY, Z, EZ, EOut>,
): Pair<X, EIn, Z, EOut> {
  return {
    forward: (x: X) => {
      const y = xy.pair.forward(x);
      if (y.tag === "error") return err(xy.mapDomErr(y.error));
      const z = yz.pair.forward(y.ok);
      if (z.tag === "error") return err(xy.mapCodErr(z.error));
      return z;
    },
    backward: (z: Z) => {
      const y = yz.pair.backward(z);
      if (y.tag === "error") return err(yz.mapCodErr(y.error));
      const x = xy.pair.backward(y.ok);
      if (x.tag === "error") return err(yz.mapDomErr(x.error));
      return x;
    },
  };
}

// and the composed pair narrows on both sides once its errors are concrete
type DomErr = Sum<{ declined: { reason: string } }>;
type CodErr = Sum<{ timeout: Unit }>;
declare const legA: Leg<string, DomErr, number, CodErr, DomErr | CodErr>;
declare const legB: Leg<number, CodErr, boolean, DomErr, DomErr | CodErr>;
const t14Composed = t14Compose(legA, legB);
const t14Forward = t14Composed.forward("hi");
if (isErr(t14Forward)) {
  const composedErr: DomErr | CodErr = t14Forward.error;
} else {
  const composedOk: boolean = t14Forward.ok;
}

// a union error payload stays one `Err` holding the union, not one `Err` per member
declare const combinedErr: Err<DomErr | CodErr>;
const combinedProbe: Result<string, DomErr | CodErr> = combinedErr;

// forwarding an error onward, still generic, needs no assertion either
function t14MapOk<T, U, E>(r: Result<T, E>, f: (t: T) => U): Result<U, E> {
  if (isErr(r)) return r;
  return ok(f(r.ok));
}

// ── T17: wrapError -- an error wrapped under a tag, and nothing added for a step that can't fail
declare const t17Total: Result<number, never>;
declare const t17Fallible: Result<number, "bad">;
declare const t17Nested: Result<number, ParseErr>;

// a total result stays total, so `.ok` reads without narrowing
const t17TotalValue: number = wrapError(t17Total, "parse").ok;
const t17FallibleProbe: Result<number, Sum<{ parse: "bad" }>> = wrapError(t17Fallible, "parse");
const t17NestedProbe: Result<number, Sum<{ parse: ParseErr }>> = wrapError(t17Nested, "parse");
// @ts-expect-error the declared error has no `parse` case
const t17Missing: Result<number, Sum<{ other: Unit }>> = wrapError(t17Fallible, "parse");
// a total result checked against a declared error type adds no case the declaration must list;
// this is what `NoInfer` in wrapError's return type guards
const t17TotalProbe: Result<number, Sum<{ other: Unit }>> = wrapError(t17Total, "parse");

// generic code returns it with no cast, naming its result with `Wrapped`
function t17Wrap<T, E, const K extends string>(r: Result<T, E>, tag: K): Result<T, Wrapped<K, E>> {
  return wrapError(r, tag);
}

const t17Mapped: Result<number, string> = mapError(t17Fallible, (e) => `${e}!`);
declare const t17Located: At<string, "bad">;
const t17LocatedError: "bad" = t17Located.error;

// ── T18: tryFlow: a chain built once on a declared constant, each step inferring from it
type T18ListErr = Sum<{ empty: Unit }>;
const t18Listed: (items: readonly string[]) => Result<string, T18ListErr> = tryFlow(
  rejectIf((items) => items.length === 0, "empty"),
  step((items) => items.join(", ")),
);

// the chain's error is every function's error; one that can't fail, given a tag, adds no case
type T18Err = Sum<{ parse: ParseErr; tooBig: Unit }>;
const t18Parsed: Fallible<string, number, T18Err> = tryFlow(
  step(parseId, "parse"),
  rejectIf((n) => n > 100, "tooBig"),
  step(step((n) => n * 2), "double"),
);

// a chain of steps that can't fail can't fail either, so `.ok` reads without narrowing
const t18Total = tryFlow(step((n: number) => n + 1), step((n) => `${n}`));
const t18TotalValue: string = t18Total(1).ok;

// an inline step returning only `ok(...)` adds no error case
const t18OkOnly: Fallible<number, number, never> = tryFlow((n: number) => ok(n + 1));

// a step taking the wrong input is reported on the step before it: the annotated parameter fixes
// the type between them, and the earlier step is the one that fails to produce it
const t18Mismatch: Fallible<string, number, ParseErr> = tryFlow(
  // @ts-expect-error parseId produces a number, but the next step takes a string
  parseId,
  step((id: string) => id.length),
);

const t18Dotted: Fallible<readonly string[], readonly string[], Sum<{ dotInSegment: string }>> = rejectWith(
  (path) => fromNullable(path.find((segment) => segment.includes("."))),
  "dotInSegment",
);
const t18Prepended: (rest: readonly number[]) => readonly number[] = prepend([0]);
const t18PrependStep: Fallible<readonly number[], readonly number[], never> = step(prepend([0]));

// tryFlatMap locates a failure at the item's index, or at at(item); a function that can't fail locates nothing
type T18Item = { readonly key: string; readonly size: number };
const t18ByIndex: Fallible<readonly T18Item[], readonly number[], Sum<{ item: At<number, "two"> }>> = tryFlatMap(
  (item: T18Item) => (item.size === 2 ? err("two") : ok([item.size])),
  "item",
);
const t18ByKey: Fallible<readonly T18Item[], readonly number[], Sum<{ item: At<string, "two"> }>> = tryFlatMap(
  (item: T18Item) => (item.size === 2 ? err("two") : ok([item.size])),
  "item",
  (item) => item.key,
);
const t18AllItems = tryFlatMap(step((item: T18Item) => [item.size]), "item");
const t18AllItemsValue: readonly number[] = t18AllItems([]).ok;

// a location of another type than the declared one is rejected, the index included
// @ts-expect-error at returns a string, the declaration expects an index
const t18WrongLocation: Fallible<readonly T18Item[], readonly number[], Sum<{ item: At<number, "two"> }>> =
  tryFlatMap((item: T18Item) => (item.size === 2 ? err("two") : ok([item.size])), "item", (item) => item.key);
// @ts-expect-error without at, the location is the index, not the key the declaration expects
const t18MissingAt: Fallible<readonly T18Item[], readonly number[], Sum<{ item: At<string, "two"> }>> = tryFlatMap(
  (item: T18Item) => (item.size === 2 ? err("two") : ok([item.size])),
  "item",
);

// and tryFlow composes steps whose types are still generic
function t18Compose<A, B, C, E>(f: Fallible<A, B, E>, g: Fallible<B, C, E>): Fallible<A, C, E> {
  return tryFlow(f, g);
}

// ── T19: tryOver and over: one part of a structure updated, the whole rebuilt around it
type T19Order = { code: string; payment: { card: { number: string } } };
type T19Parsed = { code: string; payment: { card: { number: number } } };
const t19Parse: Fallible<T19Order, T19Parsed, never> = tryOver("payment", tryOver("card", tryOver("number", step(Number))));

// the step's error passes through as the zoomed step's own
const t19Fallible: Fallible<T19Order, T19Order, ParseErr> = tryOver("code", (code: string) =>
  code === "" ? errVariant("parse", { input: code }) : ok(code),
);

// a tuple keeps its other positions
type T19Pair = readonly [string, number];
const t19Bumped: Fallible<T19Pair, readonly [string, string], never> = tryOver(1, step((n) => `${n + 1}`));
const t19Over: (pair: T19Pair) => readonly [string, boolean] = over(1, (n) => n > 0);

// a wrong key is reported where it is written
// @ts-expect-error `crad` is not a key of the payment
const t19Typo: Fallible<T19Order, T19Parsed, never> = tryOver("payment", tryOver("crad", tryOver("number", step(Number))));

// ── T20: tryMatch: a step over a sum, typed from the declared constant
type T20Shape = Sum<{ circle: number; square: number; rect: [number, number]; empty: Unit }>;
type T20Err = Sum<{ rect: "degenerate" }>;

// inline handlers get their payload types; a handler that can't fail adds no error case
const t20Area: Fallible<T20Shape, number, T20Err> = tryMatch({
  circle: (r) => ok(Math.PI * r * r),
  square: (side) => ok(side * side),
  rect: ([w, h]) => (w === 0 || h === 0 ? err("degenerate") : ok(w * h)),
  empty: () => ok(0),
});

// a match whose handlers can't fail can't fail either
const t20Total: Fallible<T20Shape, string, never> = tryMatch({
  circle: () => ok("circle"),
  square: () => ok("square"),
  rect: () => ok("rect"),
  empty: () => ok("empty"),
});
declare const t20Shape: T20Shape;
const t20TotalValue: string = t20Total(t20Shape).ok;

// @ts-expect-error every tag needs a handler
const t20Missing: Fallible<T20Shape, number, never> = tryMatch({
  circle: (r) => ok(r),
  square: (side) => ok(side),
  rect: ([w]) => ok(w),
});

const t20Extra: Fallible<T20Shape, number, never> = tryMatch({
  circle: (r) => ok(r),
  square: (side) => ok(side),
  rect: ([w]) => ok(w),
  empty: () => ok(0),
  // @ts-expect-error a handler for a tag the sum doesn't have
  triangle: () => ok(0),
});

// a rejected handler is the only error: the declaration is not reported a second time
const t20WrongPayload: Fallible<T20Shape, number, never> = tryMatch({
  // @ts-expect-error the circle's payload is a number
  circle: (r: string) => ok(r.length),
  square: (side) => ok(side),
  rect: ([w]) => ok(w),
  empty: () => ok(0),
});

// handlers that really succeed with `unknown` keep it, rather than reading as a rejected match
declare const t20Unknown: Fallible<number, unknown, unknown>;
// @ts-expect-error the output is unknown, not number
const t20UnknownOut: Fallible<Sum<{ a: number; b: number }>, number, Sum<{ a: unknown; b: unknown }>> = tryMatch({
  a: (n: number): Result<unknown, unknown> => t20Unknown(n),
  b: (n: number): Result<unknown, unknown> => t20Unknown(n),
});

// nested in a declared chain, it takes its input from the step before
const t20Chained: Fallible<string, number, T20Err> = tryFlow(
  step((raw: string): T20Shape => variant("circle", Number(raw))),
  tryMatch({
    circle: (r) => ok(Math.PI * r * r),
    square: (side) => ok(side * side),
    rect: ([w, h]) => (w === 0 || h === 0 ? err("degenerate") : ok(w * h)),
    empty: () => ok(0),
  }),
);

// ── T21: flow: plain functions composed left to right, typed from the declared constant
type T21Path = Sum<{ here: Unit; into: { key: string; rest: T21Path } }>;
declare const t21Dotted: (path: T21Path) => string;
const t21Identifier: (path: T21Path) => string = flow(t21Dotted, (text) => (text === "" ? "#" : text));
const t21Length: (path: T21Path) => number = flow((path) => t21Dotted(path), (text) => text.length);

// a Result reaches the next function as a Result
const t21Parsed: (path: T21Path) => Result<number, ParseErr> = flow(t21Dotted, parseId);
const t21Outcome: (raw: string) => "ok" | "error" = flow(parseId, (r) => r.tag);

const t21Mismatch: (path: T21Path) => number = flow(
  // @ts-expect-error t21Dotted produces a string, but the next function takes a number
  t21Dotted,
  (n: number) => n + 1,
);

function t21Compose<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C {
  return flow(f, g);
}

// ── T22: match: a function over a sum, typed from the declared constant
type T22Path = Sum<{ here: Unit; into: { key: string; rest: T22Path } }>;
const t22Dotted: (path: T22Path) => string = match({
  here: () => "",
  into: ({ key, rest }) => key + t22Dotted(rest),
});
const t22Segment: (path: T22Path) => Option<string> = match({
  here: () => none(),
  into: ({ key, rest }) => (key.includes(".") ? some(key) : t22Segment(rest)),
});

// each mistake is one error, where it is written
const t22Missing: (path: T22Path) => string = match(
  // @ts-expect-error every tag needs a handler
  { here: () => "" },
);
const t22Extra: (path: T22Path) => string = match({
  here: () => "",
  into: () => "",
  // @ts-expect-error a handler for a tag the sum doesn't have
  there: () => "",
});
// @ts-expect-error a handler returns a number where a string is declared
const t22WrongOutput: (path: T22Path) => string = match({
  here: () => "",
  into: () => 1,
});

// handlers that really return `unknown` keep it
declare const t22Unknown: (n: number) => unknown;
const t22UnknownOut: (s: Sum<{ a: number; b: number }>) => unknown = match({
  a: (n: number): unknown => t22Unknown(n),
  b: (n: number): unknown => t22Unknown(n),
});
// @ts-expect-error the output is unknown, not number
const t22UnknownAsNumber: (s: Sum<{ a: number; b: number }>) => number = match({
  a: (n: number): unknown => t22Unknown(n),
  b: (n: number): unknown => t22Unknown(n),
});

// ── T23: lazy: a chain refers to a constant declared after it
type T23Field = { readonly key: string; readonly shape: T23Shape };
type T23Shape = Sum<{ scalar: Unit; object: readonly T23Field[] }>;
type T23Column = readonly string[];
type T23Err = Sum<{ object: T23ObjectErr }>;
type T23ObjectErr = Sum<{ noFields: Unit; field: At<string, T23Err> }>;

const t23FieldColumns: Fallible<T23Field, readonly T23Column[], T23Err> = tryFlow(
  tryOver("shape", lazy(() => t23Columns)),
  step(({ key, shape }) => shape.map((path) => [key, ...path])),
);
const t23ObjectColumns: Fallible<readonly T23Field[], readonly T23Column[], T23ObjectErr> = tryFlow(
  rejectIf((fields) => fields.length === 0, "noFields"),
  tryFlatMap(t23FieldColumns, "field", (field) => field.key),
);
const t23Columns: Fallible<T23Shape, readonly T23Column[], T23Err> = tryMatch({
  scalar: step(() => [[]]),
  object: t23ObjectColumns,
});

type T23Nest = Sum<{ leaf: number; wrap: T23Nest }>;
const t23Doubled: (nest: T23Nest) => number = match({
  leaf: (n) => n,
  // @ts-expect-error without lazy, the constant is read while it is being declared
  wrap: flow(t23Doubled, (n) => n * 2),
});

// ── T24: tryMap and tryReduce, and step's two forms
type T24Item = { readonly key: string; readonly size: number };
const t24Size = (item: T24Item) => (item.size < 0 ? err("negative") : ok(item.size));

const t24ByIndex: Fallible<readonly T24Item[], readonly number[], Sum<{ item: At<number, "negative"> }>> = tryMap(
  t24Size,
  "item",
);
const t24ByKey: Fallible<readonly T24Item[], readonly number[], Sum<{ item: At<string, "negative"> }>> = tryMap(
  t24Size,
  "item",
  (item) => item.key,
);
const t24Total: Fallible<readonly T24Item[], readonly string[], never> = tryMap(step((item: T24Item) => item.key), "item");
const t24TotalValue: readonly string[] = t24Total([]).ok;

const t24Sum: Fallible<readonly T24Item[], number, Sum<{ term: At<number, "negative"> }>> = tryReduce(
  (sum, item) => (item.size < 0 ? err("negative") : ok(sum + item.size)),
  0,
  "term",
);

// generic code names its result with Located
function t24Each<N, B, E>(f: Fallible<N, B, E>): Fallible<readonly N[], readonly B[], Wrapped<"each", Located<number, E>>> {
  return tryMap(f, "each");
}

// @ts-expect-error a tag is for a fallible function; this one can't fail
const t24TaggedTotal: Fallible<number, number, never> = step((n: number) => n + 1, "inc");
// @ts-expect-error without its tag, the fallible function's Result becomes the success value
const t24MissingTag: Fallible<string, number, Sum<{ parse: ParseErr }>> = tryFlow(step(parseId));

// ── T25: r -- each tag and payload checked against the declared return type, where it's written
type T25ShapeErr = Sum<{ noFields: Unit }>;
type T25Err = Sum<{ dotInKey: Unit; shape: T25ShapeErr; tooLong: number }>;
declare function t25Leaves(key: string): Result<readonly string[], T25ShapeErr>;

function t25Field(key: string): Result<readonly string[], T25Err> {
  return r(($) => {
    if (key.includes(".")) return $.fail("dotInKey");
    if (key.length > 63) return $.fail("tooLong", key.length);
    return $.try(t25Leaves(key), "shape");
  });
}

function t25Mistakes(key: string): Result<readonly string[], T25Err> {
  return r(($) => {
    // @ts-expect-error a tag the error type doesn't have
    if (key === "a") return $.fail("dotInKy");
    // @ts-expect-error one argument is only for a case whose payload is Unit
    if (key === "b") return $.fail("tooLong");
    // @ts-expect-error the payload's type is the case's
    if (key === "c") return $.fail("tooLong", "many");
    // @ts-expect-error try wraps under a tag the error type has
    if (key === "d") return $.try(t25Leaves(key), "shap");
    // @ts-expect-error that tag's payload is the result's error
    if (key === "e") return $.try(t25Leaves(key), "dotInKey");
    return [];
  });
}

function t25WrongValue(key: string): Result<readonly string[], T25Err> {
  // @ts-expect-error the success value is the declared one
  return r(($) => {
    if (key === "") return $.fail("dotInKey");
    return key.length;
  });
}

const t25Undeclared = (key: string) =>
  r(($) => {
    // @ts-expect-error without a declared return type, the error type has no cases
    if (key === "") return $.fail("empty");
    return key;
  });

function t25Total(n: number): Result<number, never> {
  return r(($) => {
    // @ts-expect-error a function that can't fail has no case to fail with
    if (n < 0) return $.fail("negative");
    return n * 2;
  });
}
const t25TotalValue: number = t25Total(1).ok;

function t25First<T>(items: readonly T[]): Result<T, Sum<{ empty: Unit }>> {
  return r(($) => {
    const first = items[0];
    if (first === undefined) return $.fail("empty");
    return first;
  });
}

// ── T15: direct recursion -- a case whose payload *is* the recursive type, with no object or
// array in between. This shape once produced a self-referential type alias error; it must not.
type Expr15 = Sum<{ atom: Unit; wrap: Expr15; twice: Expr15 }>;
const built15: Expr15 = variant("wrap", variant("atom", null));
function depth15(x: Expr15): number {
  switch (x.tag) {
    case "atom":
      return 0;
    case "wrap":
      return 1 + depth15(x.wrap);
    case "twice":
      return 2 * depth15(x.twice);
  }
}
declare const e15: Expr15;
if (e15.tag === "wrap") {
  const inner15: Expr15 = e15.wrap;
}

// mutual recursion, both sides direct
type M15A = Sum<{ leaf: Unit; toB: M15B }>;
type M15B = Sum<{ toA: M15A }>;
declare const m15: M15A;
const m15probe: M15A = m15;

// and direct recursion under `Frozen`
type FExpr15 = Frozen<Sum<{ atom: Unit; wrap: FExpr15 }>>;
declare const f15: FExpr15;
const f15probe: FExpr15 = f15;

// ── T16: a `Sum` case is one object type, not a tag intersected with a payload. The tag and the
// payload *slot* are both readonly; the payload's own fields are not, and neither is an array
// payload -- marking those is `Frozen`'s job.
type Node16 = Sum<{ id: Unit; seq: { left: Node16; right: Node16 }; kids: Node16[] }>;
declare const n16: Node16;

if (n16.tag === "seq") {
  n16.seq.left = n16; // a payload's own fields stay writable
  // @ts-expect-error the slot holding the payload is readonly; build a new case instead
  n16.seq = { left: n16, right: n16 };
}
if (n16.tag === "kids") {
  n16.kids.push(n16); // an array payload is not frozen by `Sum` alone
}
// and a plain array payload still satisfies a mutable-array parameter
declare function takesNodes(xs: Node16[]): void;
if (n16.tag === "kids") takesNodes(n16.kids);

// @ts-expect-error the tag is readonly too
if (n16.tag === "id") n16.tag = "seq";
