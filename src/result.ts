import { variant, tagged, isVariant, type Sum } from "./variant";
import { some, none, type Option } from "./option";

/** The success case of a `Result`. */
export type Ok<T> = Sum<{ ok: T }>;
/** The error case's shape, with no `never`-collapsing: the form to cast to and to `infer` against. */
type ErrShape<E> = Sum<{ error: E }>;
/** The failure case of a `Result`; its payload is itself a tagged variant. `Err<never>` is `never`, so an infallible `Result` has no error case at all. */
export type Err<E> = [E] extends [never] ? never : ErrShape<E>;
/** A value that's either a success or an error; collapses to `Ok<T>` when `E` is `never`. */
export type Result<T, E> = Ok<T> | Err<E>;

/** The two cases spelled out, without the `never`-collapsing: what a `Result<T, E>` is at runtime regardless of `E`. */
type AnyResult<T, E> = Ok<T> | ErrShape<E>;

/** Builds the success case carrying `value`. */
export function ok<const T>(value: T): Ok<T> {
  return variant({ ok: value });
}

/** Type guard: true when `r` is the success case, narrowing to `Ok<T>`. */
export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  return isVariant(r as AnyResult<T, E>, "ok");
}

/** Builds the failure case carrying `payload` directly. */
export function err<const E>(payload: E): Err<E> {
  return variant({ error: payload }) as Err<E>;
}

/** Builds an `Err` whose payload is itself a `Sum` case: `errVariant({ tag: payload })`. */
export const errVariant = tagged("error");

/** Type guard: true when `r` is the error case, narrowing to `Err<E>`. */
export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  return isVariant(r as AnyResult<T, E>, "error");
}

/** Runs `f`, catching a throw into an `Err` (optionally mapped by `mapError`). */
export function fromThrowable<T, E = unknown>(f: () => T, mapError?: (e: unknown) => E): Result<T, E> {
  try {
    return ok(f());
  } catch (e) {
    return err(mapError ? mapError(e) : (e as E));
  }
}

type ValOf<X> = X extends Ok<infer T> ? T : never;
type ErrOf<X> = X extends ErrShape<infer E> ? E : never;
type ValuesOf<R extends readonly unknown[]> = {
  -readonly [K in keyof R]: ValOf<R[K]>;
};
type ErrorsOf<R extends readonly unknown[]> = {
  [K in keyof R]: ErrOf<R[K]>;
}[number];

/** Runs every `Result`, returning all values ok or an `Err` collecting every error. */
export function allErrors<R extends readonly Result<unknown, unknown>[]>(
  results: [...R],
): Result<ValuesOf<R>, ErrorsOf<R>[]> {
  const values: unknown[] = [];
  const errors: unknown[] = [];
  for (const r of results as readonly Result<unknown, unknown>[]) {
    if (isVariant(r, "error")) errors.push(r.error);
    else values.push(r.ok);
  }
  if (errors.length > 0) return err(errors as ErrorsOf<R>[]);
  return ok(values as ValuesOf<R>);
}

/** `Ok → Some` (unchanged value), `Err → None`, dropping the error. */
export function toOption<T, E>(r: Result<T, E>): Option<T> {
  const raw = r as AnyResult<T, E>;
  return isVariant(raw, "ok") ? some(raw.ok) : none();
}

/** `null`/`undefined` → `None`, anything else → `Some`. */
export function fromNullable<T>(value: T | null | undefined): Option<NonNullable<T>>;
/** `null`/`undefined` → `Err(error)`, anything else → `Ok`. */
export function fromNullable<T, E>(value: T | null | undefined, error: E): Result<NonNullable<T>, E>;
export function fromNullable(value: any, error?: any): any {
  if (arguments.length > 1) {
    return value != null ? ok(value) : err(error);
  }
  return value != null ? some(value) : none();
}
