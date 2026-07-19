import { variant, tagged, isVariant, type Variant } from "./variant";
import { present, type Present } from "./present";
import { none, type Option } from "./option";

/** The failure case of a `Result` — its payload is itself a tagged variant. */
export type Err<E> = Variant<"error", E>;
/** A value that's either present or an error. */
export type Result<T, E> = Present<T> | Err<E>;

/** Builds an `Err` whose payload is a `Variant` — `err(tag, payload?)`. */
export const err = tagged("error");

/** Type guard: true when `r` is the error case, narrowing to `Err<E>`. */
export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  return isVariant(r, "error");
}

/** Runs `f`, catching a throw into an `Err` (optionally mapped by `mapError`). */
export function fromThrowable<T, E = unknown>(f: () => T, mapError?: (e: unknown) => E): Result<T, E> {
  try {
    return present(f());
  } catch (e) {
    return variant("error", mapError ? mapError(e) : (e as E));
  }
}

type ValOf<X> = X extends Present<infer T> ? T : never;
type ErrOf<X> = X extends Err<infer E> ? E : never;
type ValuesOf<R extends readonly unknown[]> = {
  -readonly [K in keyof R]: ValOf<R[K]>;
};
type ErrorsOf<R extends readonly unknown[]> = {
  [K in keyof R]: ErrOf<R[K]>;
}[number];

/** Runs every `Result`, returning all values present or an `Err` collecting every error. */
export function allErrors<R extends readonly Result<unknown, unknown>[]>(
  results: [...R],
): Result<ValuesOf<R>, ErrorsOf<R>[]> {
  const values: unknown[] = [];
  const errors: unknown[] = [];
  for (const r of results as readonly Result<unknown, unknown>[]) {
    if (isVariant(r, "error")) errors.push(r.error);
    else values.push(r.present);
  }
  if (errors.length > 0) return variant("error", errors as ErrorsOf<R>[]);
  return present(values as ValuesOf<R>);
}

/** `Present → Present` unchanged, `Err → None` — drops the error. */
export function toOption<T, E>(r: Result<T, E>): Option<T> {
  return isVariant(r, "present") ? r : none();
}

/** `null`/`undefined` → `None`, anything else → `Present`. */
export function fromNullable<T>(value: T | null | undefined): Option<NonNullable<T>>;
/** `null`/`undefined` → `Err(error)`, anything else → `Present`. */
export function fromNullable<T, E>(value: T | null | undefined, error: E): Result<NonNullable<T>, E>;
export function fromNullable(value: any, error?: any): any {
  if (value != null) return present(value);
  return arguments.length > 1 ? variant("error", error) : none();
}
