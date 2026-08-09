import {
  variant, tagged, type Sum, type NestVariant, type PayloadOf,
  matchTag,
  ok, err, errVariant, isOk, isErr, fromThrowable, allErrors, toOption,
  type Ok, type Err, type Result,
  some, none, isSome, isNone, someOr,
  type Some, type None, type Option,
  unwrap, unwrapOr, expect, fromNullable, all,
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

// `all` has one overload per sum type now — Ok<T> and Some<T> no longer share
// a tag, so a single call can't feed both a Result and an Option annotation.
const all1 = all([ok(1), ok("a")]);
const all1Probe: Result<[number, string], never> = all1;

const all2 = all([some(1), some("a")]);
const all2Probe: Option<[number, string]> = all2;

// ── T7: tagged() nesting
const nested = tagged("a", "b")({ c: { x: 1 } });
type Nested = NestVariant<["a", "b"], Sum<{ c: { x: number } }>>;
const nestedProbe: Nested = nested;

// ── T8: matchTag
type Action = Sum<{ go: { n: number }; stop: null }>;
declare const action: Action;
const m1 = matchTag(action, { go: (p) => p.n, stop: -1 });
const m1Probe: number = m1;

// ── T9: multi-step Result/Option composition via early-return (chain was replaced by
// pipeResult/pipeOption, see T12; this is the same "return type is the union of every branch's
// outcome" shape either covers, one sum type at a time)
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
  // @ts-expect-error regression guard: fromEnum must distribute over its argument's
  // union, so narrowing to "active" rules out the other cases' keys entirely
  const crossCase = statusVariant.pending;
}

// ── T11: recursive self-reference -- regression guard for the whole point of this redesign
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

// ── T12: pipeResult / pipeOption -- the two Result steps from T9's chain, threaded through
// pipeResult instead of early-return, plus a raw seed and a separate pipeOption chain
declare function chargeGateway(id: number, cents: number): Result<{ receiptId: string }, ParseErr>;
const p1 = pipeResult(parseId("42"), (id) => findUser(id));
const p1Probe: Result<{ name: string }, ParseErr | NotFoundErr> = p1;

const p2 = pipeResult(parseId("42"), (id) => chargeGateway(id, 500));
const p2Probe: Result<{ receiptId: string }, ParseErr> = p2;

// a raw seed, and a plain (unwrapped) passthrough step mixed with a Result step
const p3 = pipeResult(2, (n) => n + 1, (n) => (n > 0 ? ok(n) : err("negative" as const)));
const p3Probe: Result<number, "negative"> = p3;

// pipeResult(value) with no steps returns value unchanged
const p4 = pipeResult(5);
const p4Probe: number = p4;

// a mismatched step -- fed the wrong input type -- is a compile error at that step
pipeResult(
  parseId("42"),
  // @ts-expect-error findUser expects a number (parseId's payload), not a string
  (id: string) => findUser(id),
);

declare function findUserOption(id: number): Option<{ name: string }>;
const p5 = pipeOption(some(1), (id) => findUserOption(id), (u) => nicknameOf(u));
const p5Probe: Option<string> = p5;

// pipeOption(value) with no steps returns value unchanged
const p6 = pipeOption(some("x"));
const p6Probe: Option<string> = p6;

// a mismatched step is a compile error here too
pipeOption(
  some(1),
  // @ts-expect-error findUserOption expects a number, not a string
  (id: string) => findUserOption(id),
);
