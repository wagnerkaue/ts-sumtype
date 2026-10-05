import {
  variant, tagged, type Sum, type Unit, type Frozen, type NestVariant, type PayloadOf,
  ok, err, errVariant, isOk, isErr, fromThrowable, toOption,
  wrapError, type Fallible,
  tryReduce, tryMap, tryFlatMap,
  patch, match, tryMatch, r,
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
// every branch's outcome, one sum type at a time.
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

// ── T17: wrapError -- an error wrapped under a tag, and nothing added for a result that can't fail
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

declare const t17Located: At<string, "bad">;
const t17LocatedError: "bad" = t17Located.error;

// ── T19: patch -- parts of a structure changed by functions, the whole rebuilt around them
type T19Order = {
  readonly code: string;
  readonly payment: { readonly card: { readonly number: string } };
  readonly note?: string;
};
declare const t19Order: T19Order;

// a part changes type, and the whole's type follows it, keeping readonly and optional parts
const t19Parsed: { readonly payment: { readonly card: { readonly number: number } } } = patch(t19Order, {
  payment: { card: { number: Number } },
});
const t19Coded = patch(t19Order, { code: (code) => code.length });
const t19CodedFresh: typeof t19Coded = { code: 1, payment: { card: { number: "4111" } } };
// @ts-expect-error a part stays readonly
t19Coded.code = 2;

// on a sum, a change applies to the case that has the key
type T19Shape = Sum<{ fields: readonly string[]; empty: Unit }>;
declare const t19Shape: T19Shape;
const t19Counted: Sum<{ fields: number; empty: Unit }> = patch(t19Shape, { fields: (fields) => fields.length });

// @ts-expect-error a fixed value is written as a function returning it
patch(t19Order, { code: "X" });
// @ts-expect-error an array is replaced whole, by a function
patch({ tags: ["a"] }, { tags: ["b"] });
// @ts-expect-error a key the value doesn't have
patch(t19Order, { cdoe: (code: string) => code });

// ── T20: tryMatch: a fallible function over a sum, typed from the declared constant
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

// ── T24: tryMap and tryReduce
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

const t24Sum: Fallible<readonly T24Item[], number, Sum<{ term: At<number, "negative"> }>> = tryReduce(
  (sum, item) => (item.size < 0 ? err("negative") : ok(sum + item.size)),
  0,
  "term",
);

// generic code names its result with Located
function t24Each<N, B, E>(f: Fallible<N, B, E>): Fallible<readonly N[], readonly B[], Wrapped<"each", Located<number, E>>> {
  return tryMap(f, "each");
}

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
