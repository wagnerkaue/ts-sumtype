import { variant, isVariant, unit, type Sum, type Unit } from "./variant";
import { some, none, type Option } from "./option";

/** The success case of a `Result`. */
export type Ok<T> = Sum<{ ok: T }>;
/** The error case's shape, with no `never`-collapsing: the form to cast to and to `infer` against. */
type ErrShape<E> = Sum<{ error: E }>;
/** The failure case of a `Result`; its payload is itself a tagged variant. `Err<never>` is `never`, so an infallible `Result` has no error case at all. */
export type Err<E> = [E] extends [never] ? never : ErrShape<E>;
/** A value that's either a success or an error; collapses to `Ok<T>` when `E` is `never`. */
export type Result<T, E> = Ok<T> | Err<E>;

/** A function that may fail, and how: it returns a `Result` carrying either its value or its error. */
export type Fallible<A, B, E> = (input: A) => Result<B, E>;

/** The two cases spelled out, without the `never`-collapsing: what a `Result<T, E>` is at runtime regardless of `E`. */
type AnyResult<T, E> = Ok<T> | ErrShape<E>;

/** Builds the success case carrying `value`. */
export function ok<const T>(value: T): Ok<T> {
  // Not `variant("ok", value)`: its computed key sees every tag in the program, so V8 gives the
  // object no fixed layout, and building one through it measured several times slower.
  return { tag: "ok", ok: value };
}

/** Type guard: true when `r` is the success case, narrowing to `Ok<T>`. */
export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  // Not `isVariant(r, "ok")`: that allocates an array for its rest parameter on every call.
  return (r as AnyResult<T, E>).tag === "ok";
}

/** Builds the failure case carrying `payload` directly. */
export function err<const E>(payload: E): Err<E> {
  // Not `variant("error", payload)`: a fixed-key literal keeps one object layout. See `ok`.
  return { tag: "error", error: payload } as Err<E>;
}

/** Builds an `Err` whose payload is itself a `Sum` case: `errVariant("declined", { reason })`. */
export function errVariant<const K extends string, const P>(tag: K, payload: P): Err<Sum<Record<K, P>>>;
/** Builds an `Err` whose payload is a case with no payload: `errVariant("timeout")`. */
export function errVariant<const K extends string>(tag: K): Err<Sum<Record<K, Unit>>>;
export function errVariant(tag: string, payload: unknown = unit): unknown {
  // Not `tagged("error")`: its return type is the expanded object, which a generic caller cannot
  // assign to `Err<E>`, since that stays an unresolved conditional while `E` is generic.
  return err(variant(tag, payload));
}

/** Type guard: true when `r` is the error case, narrowing to `Err<E>`. */
export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  // Not `isVariant(r, "error")`: that allocates an array for its rest parameter on every call.
  return (r as AnyResult<T, E>).tag === "error";
}

/** An error together with where it happened: the key of a field, the index of an element. */
export type At<L, E> = { readonly at: L; readonly error: E };

/**
 * `At<L, E>`, or `never` when `E` is: an item that can't fail has no failure to locate. Generic code
 * locating an error names its result with this type, as with `Wrapped`.
 */
export type Located<L, E> = [E] extends [never] ? never : At<L, E>;

/**
 * `E` as the payload of a case tagged `K`, or `never` when `E` is: wrapping an error that can't
 * happen adds no case. Generic code wrapping an error names its result with this type, which is
 * what lets it return `wrapError(...)` without a cast.
 */
export type Wrapped<K extends string, E> = [E] extends [never] ? never : Sum<Record<K, E>>;

/**
 * Wraps the error of `result` as a case tagged `tag`, the error a caller reports for the part
 * that failed: `wrapError(parseCard(raw), "card")`. A `result` that can't fail stays one.
 */
export function wrapError<T, E = never, const K extends string = string>(
  result: Result<T, E>,
  tag: K,
): Result<T, NoInfer<Wrapped<K, E>>> {
  // `NoInfer`: without it, TypeScript infers `E` from the declared type of whatever receives a
  // total `result`, and the case that can't happen comes back.
  // The cast is sound: this branch runs only when there is an error, and then `E` is not `never`.
  return isOk(result) ? result : (err(variant(tag, result.error)) as never);
}

/**
 * `f` returning its value as a `Result` with no error case, for where a fallible function goes and
 * `f` can't fail: `tryMatch({ cash: infallible(() => 0), ... })`.
 */
export function infallible<A extends readonly unknown[], T>(f: (...args: A) => T): (...args: A) => Result<T, never> {
  return (...args) => ok(f(...args));
}

/** Runs `f`, catching a throw into an `Err` (optionally mapped by `mapError`). */
export function fromThrowable<T, E = unknown>(f: () => T, mapError?: (e: unknown) => E): Result<T, E> {
  try {
    return ok(f());
  } catch (e) {
    return err(mapError ? mapError(e) : (e as E));
  }
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
