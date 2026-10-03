import { isOk, type Result } from "./result";

/**
 * Returns the success value, or throws with the error payload.
 *
 * A `Result` is the only thing worth unwrapping this way: its error case carries the reason the
 * value is missing, so the throw can report it. `None` carries nothing, and a throw on it says no
 * more than the call site already did. Give the absence a reason with `someOr` first, and the
 * `Result` that comes back unwraps here.
 */
export function unwrap<T, E>(r: Result<T, E>): T {
  if (isOk(r)) return r.ok;
  throw new Error("called unwrap() on an err Result: " + String((r as { error: unknown }).error));
}

/** Returns the success value, or `fallback` if `r` is an `Err`. */
export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return isOk(r) ? r.ok : fallback;
}

/** Returns the success value, or throws `Error(message)` if `r` is an `Err`. */
export function expect<T, E>(r: Result<T, E>, message: string): T {
  if (isOk(r)) return r.ok;
  throw new Error(message);
}
