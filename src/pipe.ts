import { type Ok, type Err, type Result } from "./result";

type AnyFn = (arg: any) => any;

function tagOf(v: unknown): string | undefined {
  return v !== null && typeof v === "object" ? (v as { tag?: unknown }).tag as string | undefined : undefined;
}

/** `v` unchanged if it's already tagged `successTag`/`haltTag`, otherwise wrapped as `{ tag: successTag, [successTag]: v }`. */
function normalize(v: unknown): unknown {
  const tag = tagOf(v);
  return tag === "ok" || tag === "error" ? v : { tag: "ok", ok: v };
}

function runPipe(value: unknown, fns: readonly AnyFn[]): unknown {
  // Invariant: `current` is always Result-shaped, from the seed through every step, never a bare
  // raw value in transit, so there is nothing to special-case once the loop ends.
  let current = normalize(value);
  for (const fn of fns) {
    if (tagOf(current) === "error") return current;
    current = normalize(fn((current as { ok: unknown }).ok));
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
 */
export function pipe<V>(value: V): EnsureOk<V>;
export function pipe<In1, F1 extends (arg: In1) => any, E1 = never>(
  value: Result<In1, E1> | In1,
  f1: F1,
): Err<E1> | EnsureOk<ReturnType<F1>>;
export function pipe<
  In1,
  F1 extends (arg: In1) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  E1 = never,
>(value: Result<In1, E1> | In1, f1: F1, f2: F2): Err<E1> | HaltErr<ReturnType<F1>> | EnsureOk<ReturnType<F2>>;
export function pipe<
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
export function pipe<
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
export function pipe<
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
export function pipe<
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
export function pipe<
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
export function pipe<
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
export function pipe(value: unknown, ...fns: readonly AnyFn[]): unknown {
  return runPipe(value, fns);
}
