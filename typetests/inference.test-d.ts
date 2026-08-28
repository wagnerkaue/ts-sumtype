import {
  variant, tagged, type Sum, type Unit, type Frozen, type NestVariant, type PayloadOf,
  matchTag,
  ok, err, errVariant, isOk, isErr, fromThrowable, allErrors, toOption,
  type Ok, type Err, type Result,
  some, none, isSome, isNone, someOr,
  type Some, type None, type Option,
  unwrap, unwrapOr, expect, fromNullable, allResults, allOptions,
  fromFlat, fromKeyed, fromEnum, type Unflattened, type Rekeyed,
  pipeResult, pipeOption,
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

// ── T3: err(payload) mirrors ok(value) -- no shape constraint; errVariant(shape) is tagged("error")
const rawErr = err({ http: "declined", extra: 1 }); // any payload, stored as-is
const rawErrProbe: Sum<{ error: { http: string; extra: number } }> = rawErr;

type ParseErr = Sum<{ parse: { input: string } }>;
const parseErr = errVariant({ parse: { input: "x" } });
const parseErrProbe: Sum<{ error: ParseErr }> = parseErr;
const unitErr = errVariant({ timeout: null });
const unitErrProbe: Sum<{ error: Sum<{ timeout: null }> }> = unitErr;
// @ts-expect-error errVariant's payload object must have exactly one key
const badTagged = errVariant({ http: "declined", extra: 1 });

// ── T4: fromThrowable / allErrors / toOption
const t4a = fromThrowable(() => 1);
const t4aProbe: Result<number, unknown> = t4a;
const t4b = fromThrowable(
  () => { throw new Error("x"); },
  (e): ParseErr => variant({ parse: { input: String(e) } }),
);
const t4bProbe: Result<never, ParseErr> = t4b;

declare const flatErrResult: Result<number, string>;
const t4c = allErrors([ok(1), flatErrResult]);
const t4cProbe: Result<[number, number], string[]> = t4c;

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

// ── T6: shared overloaded helpers (dispatch by argument shape)
const u1 = unwrap(ok(1) as Result<number, string>);
const u1Probe: number = u1;
const u2 = unwrap(some(1) as Option<number>);
const u2Probe: number = u2;

declare const flatErrResult2: Result<number, string>;
const uo1 = unwrapOr(flatErrResult2, 0);
const uo2 = unwrapOr(none<number>(), 0);

const ex1 = expect(ok(1) as Result<number, string>, "msg");
const ex2 = expect(some(1) as Option<number>, "msg");

const fn1 = fromNullable("x");
const fn1Probe: Option<string> = fn1;
const fn2 = fromNullable("x", "was null" as const);
const fn2Probe: Result<string, "was null"> = fn2;

// `allResults` and `allOptions` are separate functions, so an empty array still names
// which sum type it collects into instead of leaving the tag to be guessed.
const all1 = allResults([ok(1), ok("a")]);
const all1Probe: Result<[number, string], never> = all1;

const all2 = allOptions([some(1), some("a")]);
const all2Probe: Option<[number, string]> = all2;

const all3 = allResults([]);
const all3Probe: Result<[], never> = all3;

const all4 = allOptions([]);
const all4Probe: Option<[]> = all4;

// ── T7: tagged() nesting
const nested = tagged("a", "b")({ c: { x: 1 } });
type Nested = NestVariant<["a", "b"], Sum<{ c: { x: number } }>>;
const nestedProbe: Nested = nested;

// ── T8: matchTag
type Action = Sum<{ go: { n: number }; stop: null }>;
declare const action: Action;
const m1 = matchTag(action, { go: (p) => p.n, stop: -1 });
const m1Probe: number = m1;

// ── T9: multi-step Result/Option composition via early-return. The return type is the union of
// every branch's outcome, one sum type at a time; T12 covers that same shape through
// pipeResult/pipeOption.
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
  return matchTag(e, { num: (n) => n, paren: evalExpr });
}
const builtExpr: Expr = variant({ paren: variant({ num: 1 }) });

// variant() rejects a multi-key shape at the call site, no contextual type needed
// @ts-expect-error variant() requires exactly one key
const badVariant = variant({ a: 1, b: 2 });

// Sum<{ a: X; b: Y }> and Sum<{ a: X }> | Sum<{ b: Y }> are the same type --
// a whole table fanned out in one call, or individually-declared cases joined with `|`
type Fanned = Sum<{ a: number; b: string }>;
type Joined = Sum<{ a: number }> | Sum<{ b: string }>;
const fannedAsJoined: Joined = variant({ a: 1 }) as Fanned;
const joinedAsFanned: Fanned = variant({ b: "x" }) as Joined;

// ── T12: pipeResult / pipeOption -- the two Result steps from T9, threaded through pipeResult
// instead of early-return, plus a raw seed and a separate pipeOption chain
declare function chargeGateway(id: number, cents: number): Result<{ receiptId: string }, ParseErr>;
const p1 = pipeResult(parseId("42"), (id) => findUser(id));
const p1Probe: Result<{ name: string }, ParseErr | NotFoundErr> = p1;

const p2 = pipeResult(parseId("42"), (id) => chargeGateway(id, 500));
const p2Probe: Result<{ receiptId: string }, ParseErr> = p2;

// a raw seed, and a plain (unwrapped) passthrough step mixed with a Result step
const p3 = pipeResult(2, (n) => n + 1, (n) => (n > 0 ? ok(n) : err("negative" as const)));
const p3Probe: Result<number, "negative"> = p3;

// pipeResult(value) with no steps still returns a Result: a raw seed is wrapped in ok(...)
const p4 = pipeResult(5);
const p4Probe: Ok<number> = p4;

// a mismatched step -- fed the wrong input type -- is a compile error at that step
pipeResult(
  parseId("42"),
  // @ts-expect-error findUser expects a number (parseId's payload), not a string
  (id: string) => findUser(id),
);

declare function findUserOption(id: number): Option<{ name: string }>;
const p5 = pipeOption(some(1), (id) => findUserOption(id), (u) => nicknameOf(u));
const p5Probe: Option<string> = p5;

// pipeOption(value) with no steps still returns an Option: an already-wrapped seed passes through
const p6 = pipeOption(some("x"));
const p6Probe: Option<string> = p6;

// ... and a raw seed is wrapped in some(...)
const p7 = pipeOption("x");
const p7Probe: Some<string> = p7;

// a mismatched step is a compile error here too
pipeOption(
  some(1),
  // @ts-expect-error findUserOption expects a number, not a string
  (id: string) => findUserOption(id),
);

// pipeOption's seed takes its expected type from the first step rather than from a conditional
// unwrap of its own type (`Unwrap<V>`), which TypeScript can't resolve for a bare unconstrained
// generic. That is what lets the generic caller below type check instead of failing with "B could
// be instantiated with an arbitrary type ...".
type Isomorphism<A, B, K> = {
  canon: (a: A) => Option<K>;
  do: (a: A) => Option<B>;
  undo: (b: B) => Option<A>;
};
function inverse<A, B, K>(i: Isomorphism<A, B, K>): Isomorphism<B, A, K> {
  return {
    canon: (b) => pipeOption(b, i.undo, i.canon),
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
const builtTerm: Term = variant({ seq: { left: variant({ id: null }), right: variant({ id: null }) } });

// `Frozen<Term>` is `Term`, so a recursive traversal over a frozen ADT still type checks
function countTerms(t: Term): number {
  return matchTag(t, {
    id: 1,
    seq: (s) => countTerms(s.left) + countTerms(s.right),
    kids: (xs) => xs.reduce((n, x) => n + countTerms(x), 0),
    table: (tbl) => Object.values(tbl).reduce((n, x) => n + countTerms(x), 0),
    span: 1,
    render: 1,
    stamp: 1,
  });
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

// pipeResult's error slot defaults to `never`, so a pipe that cannot halt reads the same way
const pipeValue: string = pipeResult({ id: "x" }, (r) => r.id).ok;
const pipeSeeded: number = pipeResult(ok(5), (v) => v + 1).ok;

// the collapse must not leak into a generic `E`: a function still building a `Result<T, E>`
// for an unresolved `E` accepts `err(...)` with no assertion at the construction site.
type Fallible<A, B, E> = (a: A) => Result<B, E>;
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

// ── T15: direct recursion -- a case whose payload *is* the recursive type, with no object or
// array in between. This shape once produced a self-referential type alias error; it must not.
type Expr15 = Sum<{ atom: Unit; wrap: Expr15; twice: Expr15 }>;
const built15: Expr15 = variant({ wrap: variant({ atom: null }) });
function depth15(x: Expr15): number {
  return matchTag(x, { atom: () => 0, wrap: (i) => 1 + depth15(i), twice: (i) => 2 * depth15(i) });
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
