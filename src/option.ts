import { variant, isVariant, unit, type Sum, type Unit } from "./variant";
import { ok, err, type Result } from "./result";

/** The present case of an `Option`. */
export type Some<T> = Sum<{ some: T }>;
/** The absent case of an `Option`. */
export type None = Sum<{ none: Unit }>;
/** A value that may be absent. */
export type Option<T> = Some<T> | None;

/** Builds the present case carrying `value`. */
export function some<T>(value: T): Option<T> {
  return variant({ some: value });
}

/** Builds the absent case. Returns a fresh object each call, so compare by tag, not `===`. */
export function none<T = never>(): Option<T> {
  return variant({ none: unit });
}

/** Type guard: true when `o` is the present case, narrowing to `Some<T>`. */
export function isSome<T>(o: Option<T>): o is Some<T> {
  return isVariant(o, "some");
}

/** Type guard: true when `o` is the absent case, narrowing to `None`. */
export function isNone<T>(o: Option<T>): o is None {
  return isVariant(o, "none");
}

/** `Some → Ok` (unchanged value), `None → Err(error)`. */
export function someOr<T, E>(o: Option<T>, error: E): Result<T, E> {
  return isVariant(o, "some") ? ok(o.some) : err(error);
}
