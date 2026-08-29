import { isOk, type Ok, type Result } from "./result";

/** The value `all` pulls out of one `Ok` element. */
type ValueOf<R> = R extends Ok<infer T> ? T : never;
/** The halting member of an element: its `Err`. */
type HaltOf<X> = Exclude<X, Ok<unknown>>;

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

type ValuesOf<R extends readonly unknown[]> = {
  -readonly [K in keyof R]: ValueOf<R[K]>;
};

/** Ok-of-a-tuple over `Result`s: all `Ok`, or the first `Err` found. */
export function all<R extends readonly Result<unknown, unknown>[]>(
  items: [...R],
): Ok<ValuesOf<R>> | HaltOf<R[number]> {
  const values: unknown[] = [];
  for (const item of items as any[]) {
    if (item.tag === "ok") { values.push(item.ok); continue; }
    return item;
  }
  return { tag: "ok", ok: values } as Ok<ValuesOf<R>>;
}
