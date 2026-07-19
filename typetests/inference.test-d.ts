import {
  variant, tagged, type Variant, type NestVariant, type PayloadOf,
  matchTag,
  present, err, isPresent, isErr, fromThrowable, allErrors, toOption,
  type Present, type Err, type Result,
  none, isNone, presentOr,
  type None, type Option,
  unwrap, unwrapOr, expect, fromNullable, all,
  chain,
  fromFlat, fromKeyed, fromEnum, type Unflattened, type Rekeyed,
} from "../src/index";

// ── T1: Variant basics
type Idle = Variant<"idle">;
declare const idle: Idle;
const idlePayload: undefined = idle.idle;
// @ts-expect-error tag-named payload key must be present even for unit variants
const badIdle: Idle = { tag: "idle" };

// ── T2: Result construction & narrowing
const r1: Result<number, string> = present(1);
const r2: Result<number, never> = present(2);
const r2widen: Result<number, string> = r2; // covariant widening

declare const r3: Result<number, string>;
function earlyReturn(): number {
  if (r3.tag === "error") return -1; // native narrowing, zero methods
  return r3.present;
}
function earlyReturnGuard(): number {
  if (isErr(r3)) return -1;
  return r3.present; // narrowed via isErr
}

// ── T3: err() is tagged("error")
type ParseErr = Variant<"parse", { input: string }>;
const parseErr = err("parse", { input: "x" });
const parseErrProbe: Variant<"error", ParseErr> = parseErr;
const unitErr = err("timeout");
const unitErrProbe: Variant<"error", Variant<"timeout">> = unitErr;
// @ts-expect-error explicit non-undefined payload type omitted is rejected (soundness)
const badTagged = err<"http", string>("http");

// ── T4: fromThrowable / allErrors / toOption
const t4a = fromThrowable(() => 1);
const t4aProbe: Result<number, unknown> = t4a;
const t4b = fromThrowable(
  () => { throw new Error("x"); },
  (e): ParseErr => variant("parse", { input: String(e) }),
);
const t4bProbe: Result<never, ParseErr> = t4b;

declare const flatErrResult: Result<number, string>;
const t4c = allErrors([present(1), flatErrResult]);
const t4cProbe: Result<[number, number], string[]> = t4c;

const t4d = toOption(present(1));
const t4dProbe: Option<number> = t4d;

// ── T5: Option construction & narrowing (present case is Present<T>)
const o1: Option<string> = present("x");
const o2: Option<string> = none();
declare const o3: Option<number>;
if (isPresent(o3)) {
  const v: number = o3.present;
}
const converted = presentOr(present(1), "missing");
const convertedProbe: Result<number, string> = converted;

// ── T6: shared overloaded helpers (dispatch by argument shape)
const u1 = unwrap(present(1) as Result<number, string>);
const u1Probe: number = u1;
const u2 = unwrap(present(1) as Option<number>);
const u2Probe: number = u2;

declare const flatErrResult2: Result<number, string>;
const uo1 = unwrapOr(flatErrResult2, 0);
const uo2 = unwrapOr(none<number>(), 0);

const ex1 = expect(present(1) as Result<number, string>, "msg");
const ex2 = expect(present(1) as Option<number>, "msg");

const fn1 = fromNullable("x");
const fn1Probe: Option<string> = fn1;
const fn2 = fromNullable("x", "was null" as const);
const fn2Probe: Result<string, "was null"> = fn2;

const all1 = all([present(1), present("a")]);
const all1Probe: Result<[number, string], never> = all1;
// the same `all` result flows into an Option annotation: Present<tuple> is
// assignable to both Result<tuple, never> and Option<tuple>
const all2 = all([present(1), present("a")]);
const all2Probe: Option<[number, string]> = all2;

// ── T7: tagged() nesting
const nested = tagged("a", "b")("c", { x: 1 });
type Nested = NestVariant<["a", "b"], Variant<"c", { x: number }>>;
const nestedProbe: Nested = nested;

// ── T8: matchTag
type Action = Variant<"go", { n: number }> | Variant<"stop">;
declare const action: Action;
const m1 = matchTag(action, { go: (p) => p.n, stop: -1 });
const m1Probe: number = m1;

// ── T9: chain -- pure Result, pure Option, and mixed
type NotFoundErr = Variant<"not_found", { id: number }>;
declare function parseId(s: string): Result<number, ParseErr>;
declare function findUser(id: number): Result<{ name: string }, NotFoundErr>;
declare function nicknameOf(u: { name: string }): Option<string>;
declare function maybeUser(id: number): Option<{ name: string }>;

function pureResultChain(s: string): Present<string> | Err<ParseErr> | Err<NotFoundErr> {
  return chain(present(s)).andThen(parseId).andThen(findUser).map((u) => u.name).done();
}

function mixedChain(s: string): Present<string> | Err<ParseErr> | Err<NotFoundErr> | None {
  return chain(present(s)).andThen(parseId).andThen(findUser).andThen(nicknameOf).done();
}

function pureOptionChain(id: number): Present<string> | None {
  return chain(present(id)).andThen(maybeUser).map((u) => u.name).done();
}

// A bare value is not a variant, so it cannot seed a chain: wrap it as present().
// @ts-expect-error bare seed rejected; use chain(present(5))
chain(5);

// ── T10: adapt -- fromFlat / fromKeyed / fromEnum
type FlatEvent =
  | { type: "video"; duration: number; size: number }
  | { type: "message"; text: string };
type UnflatEvent = Variant<"video", { duration: number; size: number }> | Variant<"message", { text: string }>;

declare const flatEvent: FlatEvent;
const unflat = fromFlat("type", flatEvent);
const unflatProbe: UnflatEvent = unflat;
// direct-call and curried forms distribute identically
const unflatCurried = fromFlat("type")(flatEvent);
const unflatCurriedProbe: UnflatEvent = unflatCurried;
const unflatTypeProbe: Unflattened<"type", FlatEvent> = unflatProbe;

// @ts-expect-error discriminant value must be a string
fromFlat("type", { type: 1 });

type NestedEvent =
  | { kind: "video"; data: { duration: number } }
  | { kind: "message"; data: { text: string } };
type RekeyedEvent = Variant<"video", { duration: number }> | Variant<"message", { text: string }>;

declare const nestedEvent: NestedEvent;
const rekeyed = fromKeyed("kind", "data", nestedEvent);
const rekeyedProbe: RekeyedEvent = rekeyed;
const rekeyedCurried = fromKeyed("kind", "data")(nestedEvent);
const rekeyedCurriedProbe: RekeyedEvent = rekeyedCurried;
const rekeyedTypeProbe: Rekeyed<"kind", "data", NestedEvent> = rekeyedProbe;

type Status = "active" | "pending" | "inactive";
declare const status: Status;
const statusVariant = fromEnum(status);
const statusProbe: Variant<"active"> | Variant<"pending"> | Variant<"inactive"> = statusVariant;
if (statusVariant.tag === "active") {
  const activePayload: undefined = statusVariant.active;
}
