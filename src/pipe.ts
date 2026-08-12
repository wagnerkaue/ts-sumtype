import { type Ok, type Err, type Result } from "./result";
import { type Some, type None, type Option } from "./option";

type AnyFn = (arg: any) => any;

function tagOf(v: unknown): string | undefined {
  return v !== null && typeof v === "object" ? (v as { tag?: unknown }).tag as string | undefined : undefined;
}

/** `v` unchanged if it's already tagged `successTag`/`haltTag`, otherwise wrapped as `{ tag: successTag, [successTag]: v }`. */
function normalize(v: unknown, successTag: string, haltTag: string): unknown {
  const tag = tagOf(v);
  return tag === successTag || tag === haltTag ? v : { tag: successTag, [successTag]: v };
}

function runPipe(value: unknown, fns: readonly AnyFn[], successTag: string, haltTag: string): unknown {
  // Invariant: `current` is always Result-/Option-shaped, from the seed through every step --
  // never a bare raw value in transit -- so there's nothing to special-case once the loop ends.
  let current = normalize(value, successTag, haltTag);
  for (const fn of fns) {
    if (tagOf(current) === haltTag) return current;
    const input = (current as Record<string, unknown>)[successTag];
    current = normalize(fn(input), successTag, haltTag);
  }
  return current;
}

// ── Result ──

/** The success payload of `S` (a step's return type): unwraps `Ok`, drops `Err`, passes a non-`Sum` value through as-is. */
type UnwrapOk<S> = S extends Ok<infer T> ? T : S extends { tag: string } ? never : S;
/** `Err<E>` for `S`, or `never` for `Ok<T>`/a plain non-`Sum` value. */
type HaltErr<S> = S extends Ok<unknown> ? never : S extends { tag: string } ? S : never;
/** `S` unchanged if it's already `Ok`/`Err`, otherwise `Ok<S>`; the pipe's own result is always a `Result`, even when the last step (or a zero-step seed) is a plain value. */
type EnsureOk<S> = S extends Ok<unknown> ? S : S extends Err<unknown> ? S : Ok<S>;

/**
 * Threads `value` through a sequence of functions left to right, each receiving the previous
 * step's unwrapped `ok` payload. A step may return `Result` (halting the pipe on `error`) or a
 * plain value (always passed through). `value` itself may likewise be raw or a `Result`.
 *
 * Typed for up to 8 steps via individually-checked overloads. Each step after the first is
 * checked against the previous step's *declared* return type, so a mismatched step is a compile
 * error at that step. The seed's own expected type is inferred from the first step rather than
 * unwrapped by a conditional type, which is what keeps this sound when `value`'s type is a bare,
 * unconstrained generic: `Unwrap<V>` has no resolution for a generic `V`, so unwrapping the seed
 * that way rejects generic callers.
 *
 * See [`pipeOption`](#pipeoption) for the `Option` equivalent.
 */
export function pipeResult<V>(value: V): EnsureOk<V>;
export function pipeResult<In1, F1 extends (arg: In1) => any, E1 = never>(
  value: Result<In1, E1> | In1,
  f1: F1,
): Err<E1> | EnsureOk<ReturnType<F1>>;
export function pipeResult<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  E1 = never,
>(value: Result<In1, E1> | In1, f1: F1, f2: F2): Err<E1> | HaltErr<ReturnType<F1>> | EnsureOk<ReturnType<F2>>;
export function pipeResult<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  E1 = never,
>(
  value: Result<In1, E1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
): Err<E1> | HaltErr<ReturnType<F1>> | HaltErr<ReturnType<F2>> | EnsureOk<ReturnType<F3>>;
export function pipeResult<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
  E1 = never,
>(
  value: Result<In1, E1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
): Err<E1> | HaltErr<ReturnType<F1>> | HaltErr<ReturnType<F2>> | HaltErr<ReturnType<F3>> | EnsureOk<ReturnType<F4>>;
export function pipeResult<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapOk<ReturnType<F4>>) => any,
  E1 = never,
>(
  value: Result<In1, E1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
):
  | Err<E1>
  | HaltErr<ReturnType<F1>>
  | HaltErr<ReturnType<F2>>
  | HaltErr<ReturnType<F3>>
  | HaltErr<ReturnType<F4>>
  | EnsureOk<ReturnType<F5>>;
export function pipeResult<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapOk<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapOk<ReturnType<F5>>) => any,
  E1 = never,
>(
  value: Result<In1, E1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
  f6: F6,
):
  | Err<E1>
  | HaltErr<ReturnType<F1>>
  | HaltErr<ReturnType<F2>>
  | HaltErr<ReturnType<F3>>
  | HaltErr<ReturnType<F4>>
  | HaltErr<ReturnType<F5>>
  | EnsureOk<ReturnType<F6>>;
export function pipeResult<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapOk<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapOk<ReturnType<F5>>) => any,
  F7 extends (arg: UnwrapOk<ReturnType<F6>>) => any,
  E1 = never,
>(
  value: Result<In1, E1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
  f6: F6,
  f7: F7,
):
  | Err<E1>
  | HaltErr<ReturnType<F1>>
  | HaltErr<ReturnType<F2>>
  | HaltErr<ReturnType<F3>>
  | HaltErr<ReturnType<F4>>
  | HaltErr<ReturnType<F5>>
  | HaltErr<ReturnType<F6>>
  | EnsureOk<ReturnType<F7>>;
export function pipeResult<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapOk<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapOk<ReturnType<F5>>) => any,
  F7 extends (arg: UnwrapOk<ReturnType<F6>>) => any,
  F8 extends (arg: UnwrapOk<ReturnType<F7>>) => any,
  E1 = never,
>(
  value: Result<In1, E1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
  f6: F6,
  f7: F7,
  f8: F8,
):
  | Err<E1>
  | HaltErr<ReturnType<F1>>
  | HaltErr<ReturnType<F2>>
  | HaltErr<ReturnType<F3>>
  | HaltErr<ReturnType<F4>>
  | HaltErr<ReturnType<F5>>
  | HaltErr<ReturnType<F6>>
  | HaltErr<ReturnType<F7>>
  | EnsureOk<ReturnType<F8>>;
export function pipeResult(value: unknown, ...fns: readonly AnyFn[]): unknown {
  return runPipe(value, fns, "ok", "error");
}

// ── Option ──

/** The success payload of `S` (a step's return type): unwraps `Some`, drops `None`, passes a non-`Sum` value through as-is. */
type UnwrapSome<S> = S extends Some<infer T> ? T : S extends { tag: string } ? never : S;
/** `None` for `S`, or `never` for `Some<T>`/a plain non-`Sum` value. */
type HaltNone<S> = S extends Some<unknown> ? never : S extends { tag: string } ? S : never;
/** `S` unchanged if it's already `Some`/`None`, otherwise `Some<S>`; the pipe's own result is always an `Option`, even when the last step (or a zero-step seed) is a plain value. */
type EnsureSome<S> = S extends Some<unknown> ? S : S extends None ? S : Some<S>;

/**
 * Threads `value` through a sequence of functions left to right, each receiving the previous
 * step's unwrapped `some` payload. A step may return `Option` (halting the pipe on `none`) or a
 * plain value (always passed through). `value` itself may likewise be raw or an `Option`.
 *
 * Typed for up to 8 steps via individually-checked overloads. Each step after the first is
 * checked against the previous step's *declared* return type, so a mismatched step is a compile
 * error at that step. The seed's own expected type is inferred from the first step rather than
 * unwrapped by a conditional type, which is what keeps this sound when `value`'s type is a bare,
 * unconstrained generic: `Unwrap<V>` has no resolution for a generic `V`, so unwrapping the seed
 * that way rejects generic callers.
 *
 * See [`pipeResult`](#piperesult) for the `Result` equivalent.
 */
export function pipeOption<V>(value: V): EnsureSome<V>;
export function pipeOption<In1, F1 extends (arg: In1) => any>(
  value: Option<In1> | In1,
  f1: F1,
): None | EnsureSome<ReturnType<F1>>;
export function pipeOption<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
>(value: Option<In1> | In1, f1: F1, f2: F2): None | HaltNone<ReturnType<F1>> | EnsureSome<ReturnType<F2>>;
export function pipeOption<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
>(
  value: Option<In1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
): None | HaltNone<ReturnType<F1>> | HaltNone<ReturnType<F2>> | EnsureSome<ReturnType<F3>>;
export function pipeOption<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
>(
  value: Option<In1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
): None | HaltNone<ReturnType<F1>> | HaltNone<ReturnType<F2>> | HaltNone<ReturnType<F3>> | EnsureSome<ReturnType<F4>>;
export function pipeOption<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapSome<ReturnType<F4>>) => any,
>(
  value: Option<In1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
):
  | None
  | HaltNone<ReturnType<F1>>
  | HaltNone<ReturnType<F2>>
  | HaltNone<ReturnType<F3>>
  | HaltNone<ReturnType<F4>>
  | EnsureSome<ReturnType<F5>>;
export function pipeOption<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapSome<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapSome<ReturnType<F5>>) => any,
>(
  value: Option<In1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
  f6: F6,
):
  | None
  | HaltNone<ReturnType<F1>>
  | HaltNone<ReturnType<F2>>
  | HaltNone<ReturnType<F3>>
  | HaltNone<ReturnType<F4>>
  | HaltNone<ReturnType<F5>>
  | EnsureSome<ReturnType<F6>>;
export function pipeOption<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapSome<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapSome<ReturnType<F5>>) => any,
  F7 extends (arg: UnwrapSome<ReturnType<F6>>) => any,
>(
  value: Option<In1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
  f6: F6,
  f7: F7,
):
  | None
  | HaltNone<ReturnType<F1>>
  | HaltNone<ReturnType<F2>>
  | HaltNone<ReturnType<F3>>
  | HaltNone<ReturnType<F4>>
  | HaltNone<ReturnType<F5>>
  | HaltNone<ReturnType<F6>>
  | EnsureSome<ReturnType<F7>>;
export function pipeOption<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapSome<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapSome<ReturnType<F5>>) => any,
  F7 extends (arg: UnwrapSome<ReturnType<F6>>) => any,
  F8 extends (arg: UnwrapSome<ReturnType<F7>>) => any,
>(
  value: Option<In1> | In1,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
  f6: F6,
  f7: F7,
  f8: F8,
):
  | None
  | HaltNone<ReturnType<F1>>
  | HaltNone<ReturnType<F2>>
  | HaltNone<ReturnType<F3>>
  | HaltNone<ReturnType<F4>>
  | HaltNone<ReturnType<F5>>
  | HaltNone<ReturnType<F6>>
  | HaltNone<ReturnType<F7>>
  | EnsureSome<ReturnType<F8>>;
export function pipeOption(value: unknown, ...fns: readonly AnyFn[]): unknown {
  return runPipe(value, fns, "some", "none");
}
