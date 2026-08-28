import { type Sum } from "./variant";
import { type Ok, type Result } from "./result";
import { type Some, type Option } from "./option";

type ValueOf<R> = R extends Ok<infer T> ? T : R extends Some<infer T> ? T : never;

/** A tagged value read structurally. Narrowing a bare generic `R` yields `Extract<R, ...>`, which
 *  exposes no payload key, so these functions read `x` through this view instead. */
type AnyTagged = { tag: string } & Record<string, unknown>;
type HaltOf<X> = Exclude<X, Ok<unknown> | Some<unknown>>;

/** Returns the value, or throws if `x` is an `Err` or `None`. */
export function unwrap<R extends { tag: string }>(x: R): ValueOf<R> {
  const v = x as AnyTagged;
  if (v.tag === "ok") return v.ok as ValueOf<R>;
  if (v.tag === "some") return v.some as ValueOf<R>;
  if (v.tag === "error") throw new Error("called unwrap() on an err Result: " + String(v.error));
  throw new Error("called unwrap() on a none Option");
}

/** Returns the value, or `fallback` if `x` is an `Err` or `None`. */
export function unwrapOr<R extends { tag: string }>(x: R, fallback: ValueOf<R>): ValueOf<R> {
  const v = x as AnyTagged;
  if (v.tag === "ok") return v.ok as ValueOf<R>;
  if (v.tag === "some") return v.some as ValueOf<R>;
  return fallback;
}

/** Returns the value, or throws `Error(message)` if `x` is an `Err` or `None`. */
export function expect<R extends { tag: string }>(x: R, message: string): ValueOf<R> {
  const v = x as AnyTagged;
  if (v.tag === "ok") return v.ok as ValueOf<R>;
  if (v.tag === "some") return v.some as ValueOf<R>;
  throw new Error(message);
}

type ValuesOf<R extends readonly unknown[]> = {
  -readonly [K in keyof R]: ValueOf<R[K]>;
};

/** Ok-of-a-tuple over `Result`s: all `Ok`, or the first `Err` found. */
export function allResults<R extends readonly Result<unknown, unknown>[]>(
  items: [...R],
): Ok<ValuesOf<R>> | HaltOf<R[number]> {
  const values: unknown[] = [];
  for (const item of items as any[]) {
    if (item.tag === "ok") { values.push(item.ok); continue; }
    return item;
  }
  return { tag: "ok", ok: values } as Ok<ValuesOf<R>>;
}

/** Some-of-a-tuple over `Option`s: all `Some`, or the first `None` found. */
export function allOptions<R extends readonly Option<unknown>[]>(
  items: [...R],
): Some<ValuesOf<R>> | HaltOf<R[number]> {
  const values: unknown[] = [];
  for (const item of items as any[]) {
    if (item.tag === "some") { values.push(item.some); continue; }
    return item;
  }
  return { tag: "some", some: values } as Some<ValuesOf<R>>;
}
