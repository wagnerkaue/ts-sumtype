import { isVariant, type Sum } from "./variant";
import { type Ok, type Result } from "./result";
import { type Some, type Option } from "./option";

type ValueOf<R> = R extends Ok<infer T> ? T : R extends Some<infer T> ? T : never;
type HaltOf<X> = Exclude<X, Ok<unknown> | Some<unknown>>;

/** Returns the value, or throws if `x` is an `Err` or `None`. */
export function unwrap<R extends Sum<Record<string, unknown>>>(x: R): ValueOf<R> {
  if (isVariant(x, "ok")) return x.ok as ValueOf<R>;
  if (isVariant(x, "some")) return x.some as ValueOf<R>;
  if (isVariant(x, "error")) throw new Error("called unwrap() on an err Result: " + String(x.error));
  throw new Error("called unwrap() on a none Option");
}

/** Returns the value, or `fallback` if `x` is an `Err` or `None`. */
export function unwrapOr<R extends Sum<Record<string, unknown>>>(x: R, fallback: ValueOf<R>): ValueOf<R> {
  if (isVariant(x, "ok")) return x.ok as ValueOf<R>;
  if (isVariant(x, "some")) return x.some as ValueOf<R>;
  return fallback;
}

/** Returns the value, or throws `Error(message)` if `x` is an `Err` or `None`. */
export function expect<R extends Sum<Record<string, unknown>>>(x: R, message: string): ValueOf<R> {
  if (isVariant(x, "ok")) return x.ok as ValueOf<R>;
  if (isVariant(x, "some")) return x.some as ValueOf<R>;
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
