import { isVariant, unit, type Sum, type Unit } from "./variant";
import { ok, err, type Result } from "./result";

/** The present case of an `Option`. */
export type Some<T> = Sum<{ some: T }>;
/** The absent case of an `Option`. */
export type None = Sum<{ none: Unit }>;
/** A value that may be absent. */
export type Option<T> = Some<T> | None;

/** Builds the present case carrying `value`. */
export function some<const T>(value: T): Option<T> {
  // Not `variant("some", value)`: its computed key sees every tag in the program, so V8 gives the
  // object no fixed layout, and building one through it measured several times slower.
  return { tag: "some", some: value };
}

/** Builds the absent case. Returns a fresh object each call, so compare by tag, not `===`. */
export function none<T = never>(): Option<T> {
  // Not `variant("none")`: a fixed-key literal keeps one object layout. See `some`.
  return { tag: "none", none: unit };
}

/** Type guard: true when `o` is the present case, narrowing to `Some<T>`. */
export function isSome<T>(o: Option<T>): o is Some<T> {
  // Not `isVariant(o, "some")`: that allocates an array for its rest parameter on every call.
  return o.tag === "some";
}

/** Type guard: true when `o` is the absent case, narrowing to `None`. */
export function isNone<T>(o: Option<T>): o is None {
  // Not `isVariant(o, "none")`: that allocates an array for its rest parameter on every call.
  return o.tag === "none";
}

/** `Some → Ok` (unchanged value), `None → Err(error)`. */
export function someOr<T, const E>(o: Option<T>, error: E): Result<T, E> {
  return isVariant(o, "some") ? ok(o.some) : err(error);
}
