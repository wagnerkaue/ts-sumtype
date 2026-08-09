import { type Ok } from "./result";
import { type Some } from "./option";

type AnyFn = (arg: any) => any;

function tagOf(v: unknown): string | undefined {
  return v !== null && typeof v === "object" ? (v as { tag?: unknown }).tag as string | undefined : undefined;
}

function runPipe(value: unknown, fns: readonly AnyFn[], successTag: string, haltTag: string): unknown {
  let current = value;
  for (const fn of fns) {
    const tag = tagOf(current);
    if (tag === haltTag) return current;
    const input = tag === successTag ? (current as Record<string, unknown>)[successTag] : current;
    current = fn(input);
  }
  return current;
}

// ── Result ──

/** The success payload of `S` — unwraps `Ok`, drops `Err`, passes a non-`Sum` value through as-is. */
type UnwrapOk<S> = S extends Ok<infer T> ? T : S extends { tag: string } ? never : S;
/** `Err<E>` for `S`, or `never` for `Ok<T>`/a plain non-`Sum` value. */
type HaltErr<S> = S extends Ok<unknown> ? never : S extends { tag: string } ? S : never;

/** The union of every step's `Err`, plus the last step's whole return type (`Ok` and its own `Err` alike). */
type ResultChainOutput<In, Fns extends readonly AnyFn[]> =
  Fns extends readonly [infer F extends (arg: In) => any, ...infer Rest extends readonly AnyFn[]]
    ? Rest extends readonly []
      ? ReturnType<F>
      : HaltErr<ReturnType<F>> | ResultChainOutput<UnwrapOk<ReturnType<F>>, Rest>
    : never;

/** `pipeResult`'s result: `value` unchanged with no steps, otherwise every `Err` hit along the way, plus the last step's full result. */
type PipeResultOutput<V, Fns extends readonly AnyFn[]> =
  Fns extends readonly [] ? V : HaltErr<V> | ResultChainOutput<UnwrapOk<V>, Fns>;

// ── Option ──

/** The success payload of `S` — unwraps `Some`, drops `None`, passes a non-`Sum` value through as-is. */
type UnwrapSome<S> = S extends Some<infer T> ? T : S extends { tag: string } ? never : S;
/** `None` for `S`, or `never` for `Some<T>`/a plain non-`Sum` value. */
type HaltNone<S> = S extends Some<unknown> ? never : S extends { tag: string } ? S : never;

/** The union of every step's `None`, plus the last step's whole return type (`Some` and its own `None` alike). */
type OptionChainOutput<In, Fns extends readonly AnyFn[]> =
  Fns extends readonly [infer F extends (arg: In) => any, ...infer Rest extends readonly AnyFn[]]
    ? Rest extends readonly []
      ? ReturnType<F>
      : HaltNone<ReturnType<F>> | OptionChainOutput<UnwrapSome<ReturnType<F>>, Rest>
    : never;

/** `pipeOption`'s result: `value` unchanged with no steps, otherwise every `None` hit along the way, plus the last step's full result. */
type PipeOptionOutput<V, Fns extends readonly AnyFn[]> =
  Fns extends readonly [] ? V : HaltNone<V> | OptionChainOutput<UnwrapSome<V>, Fns>;

/**
 * Threads `value` through a sequence of functions left to right, each receiving the previous
 * step's unwrapped success payload. A step may return `Result` (halting the pipe on `error`) or a
 * plain value (always passed through). `value` itself may likewise be raw or a `Result`.
 *
 * Typed for up to 8 steps via individually-checked overloads (each step's parameter is checked
 * against the previous step's declared return type, so a mismatched step is a compile error at
 * that step); see [`pipeOption`](#pipeoption) for the `Option` equivalent.
 */
export function pipeResult<V>(value: V): PipeResultOutput<V, []>;
export function pipeResult<V, F1 extends (arg: UnwrapOk<V>) => any>(value: V, f1: F1): PipeResultOutput<V, [F1]>;
export function pipeResult<V, F1 extends (arg: UnwrapOk<V>) => any, F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any>(
  value: V,
  f1: F1,
  f2: F2,
): PipeResultOutput<V, [F1, F2]>;
export function pipeResult<
  V,
  F1 extends (arg: UnwrapOk<V>) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
>(value: V, f1: F1, f2: F2, f3: F3): PipeResultOutput<V, [F1, F2, F3]>;
export function pipeResult<
  V,
  F1 extends (arg: UnwrapOk<V>) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
>(value: V, f1: F1, f2: F2, f3: F3, f4: F4): PipeResultOutput<V, [F1, F2, F3, F4]>;
export function pipeResult<
  V,
  F1 extends (arg: UnwrapOk<V>) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapOk<ReturnType<F4>>) => any,
>(value: V, f1: F1, f2: F2, f3: F3, f4: F4, f5: F5): PipeResultOutput<V, [F1, F2, F3, F4, F5]>;
export function pipeResult<
  V,
  F1 extends (arg: UnwrapOk<V>) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapOk<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapOk<ReturnType<F5>>) => any,
>(value: V, f1: F1, f2: F2, f3: F3, f4: F4, f5: F5, f6: F6): PipeResultOutput<V, [F1, F2, F3, F4, F5, F6]>;
export function pipeResult<
  V,
  F1 extends (arg: UnwrapOk<V>) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapOk<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapOk<ReturnType<F5>>) => any,
  F7 extends (arg: UnwrapOk<ReturnType<F6>>) => any,
>(value: V, f1: F1, f2: F2, f3: F3, f4: F4, f5: F5, f6: F6, f7: F7): PipeResultOutput<V, [F1, F2, F3, F4, F5, F6, F7]>;
export function pipeResult<
  V,
  F1 extends (arg: UnwrapOk<V>) => any,
  F2 extends (arg: UnwrapOk<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapOk<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapOk<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapOk<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapOk<ReturnType<F5>>) => any,
  F7 extends (arg: UnwrapOk<ReturnType<F6>>) => any,
  F8 extends (arg: UnwrapOk<ReturnType<F7>>) => any,
>(
  value: V,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
  f6: F6,
  f7: F7,
  f8: F8,
): PipeResultOutput<V, [F1, F2, F3, F4, F5, F6, F7, F8]>;
export function pipeResult(value: unknown, ...fns: readonly AnyFn[]): unknown {
  return runPipe(value, fns, "ok", "error");
}

/**
 * Threads `value` through a sequence of functions left to right, each receiving the previous
 * step's unwrapped success payload. A step may return `Option` (halting the pipe on `none`) or a
 * plain value (always passed through). `value` itself may likewise be raw or an `Option`.
 *
 * Typed for up to 8 steps via individually-checked overloads (each step's parameter is checked
 * against the previous step's declared return type, so a mismatched step is a compile error at
 * that step); see [`pipeResult`](#piperesult) for the `Result` equivalent.
 */
export function pipeOption<V>(value: V): PipeOptionOutput<V, []>;
export function pipeOption<V, F1 extends (arg: UnwrapSome<V>) => any>(value: V, f1: F1): PipeOptionOutput<V, [F1]>;
export function pipeOption<
  V,
  F1 extends (arg: UnwrapSome<V>) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
>(value: V, f1: F1, f2: F2): PipeOptionOutput<V, [F1, F2]>;
export function pipeOption<
  V,
  F1 extends (arg: UnwrapSome<V>) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
>(value: V, f1: F1, f2: F2, f3: F3): PipeOptionOutput<V, [F1, F2, F3]>;
export function pipeOption<
  V,
  F1 extends (arg: UnwrapSome<V>) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
>(value: V, f1: F1, f2: F2, f3: F3, f4: F4): PipeOptionOutput<V, [F1, F2, F3, F4]>;
export function pipeOption<
  V,
  F1 extends (arg: UnwrapSome<V>) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapSome<ReturnType<F4>>) => any,
>(value: V, f1: F1, f2: F2, f3: F3, f4: F4, f5: F5): PipeOptionOutput<V, [F1, F2, F3, F4, F5]>;
export function pipeOption<
  V,
  F1 extends (arg: UnwrapSome<V>) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapSome<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapSome<ReturnType<F5>>) => any,
>(value: V, f1: F1, f2: F2, f3: F3, f4: F4, f5: F5, f6: F6): PipeOptionOutput<V, [F1, F2, F3, F4, F5, F6]>;
export function pipeOption<
  V,
  F1 extends (arg: UnwrapSome<V>) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapSome<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapSome<ReturnType<F5>>) => any,
  F7 extends (arg: UnwrapSome<ReturnType<F6>>) => any,
>(
  value: V,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
  f6: F6,
  f7: F7,
): PipeOptionOutput<V, [F1, F2, F3, F4, F5, F6, F7]>;
export function pipeOption<
  V,
  F1 extends (arg: UnwrapSome<V>) => any,
  F2 extends (arg: UnwrapSome<ReturnType<F1>>) => any,
  F3 extends (arg: UnwrapSome<ReturnType<F2>>) => any,
  F4 extends (arg: UnwrapSome<ReturnType<F3>>) => any,
  F5 extends (arg: UnwrapSome<ReturnType<F4>>) => any,
  F6 extends (arg: UnwrapSome<ReturnType<F5>>) => any,
  F7 extends (arg: UnwrapSome<ReturnType<F6>>) => any,
  F8 extends (arg: UnwrapSome<ReturnType<F7>>) => any,
>(
  value: V,
  f1: F1,
  f2: F2,
  f3: F3,
  f4: F4,
  f5: F5,
  f6: F6,
  f7: F7,
  f8: F8,
): PipeOptionOutput<V, [F1, F2, F3, F4, F5, F6, F7, F8]>;
export function pipeOption(value: unknown, ...fns: readonly AnyFn[]): unknown {
  return runPipe(value, fns, "some", "none");
}
