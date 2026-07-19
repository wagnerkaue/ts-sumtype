import { variant, isVariant, type Variant } from "./variant";

/** The success case shared by `Result` and `Option` — a value that's present. */
export type Present<T> = Variant<"present", T>;

/** Builds the present case carrying `value`. */
export function present<T>(value: T): Present<T> {
  return variant("present", value);
}

/** Type guard: true when `x` is the present case, narrowing to `Present<...>`. */
export function isPresent<R extends Variant<string, unknown>>(x: R): x is Extract<R, Present<unknown>> {
  return isVariant(x, "present");
}

type PresentOf<R> = R extends Present<infer U> ? U : never;
type HaltOf<X> = Exclude<X, Present<unknown>>;

/** Returns the present value, or throws if `x` is an `Err` or `None`. */
export function unwrap<R extends Variant<string, unknown>>(x: R): PresentOf<R> {
  if (isVariant(x, "present")) return x.present as PresentOf<R>;
  if (isVariant(x, "error")) throw new Error("called unwrap() on an err Result: " + String(x.error));
  throw new Error("called unwrap() on a none Option");
}

/** Returns the present value, or `fallback` if `x` is an `Err` or `None`. */
export function unwrapOr<R extends Variant<string, unknown>>(x: R, fallback: PresentOf<R>): PresentOf<R> {
  return isVariant(x, "present") ? (x.present as PresentOf<R>) : fallback;
}

/** Returns the present value, or throws `Error(message)` if `x` is an `Err` or `None`. */
export function expect<R extends Variant<string, unknown>>(x: R, message: string): PresentOf<R> {
  if (isVariant(x, "present")) return x.present as PresentOf<R>;
  throw new Error(message);
}

type ValuesOf<R extends readonly unknown[]> = {
  -readonly [K in keyof R]: PresentOf<R[K]>;
};

/** Present-of-a-tuple: all present values, or the first non-present member found. */
export function all<R extends readonly Variant<string, unknown>[]>(
  items: [...R],
): Present<ValuesOf<R>> | HaltOf<R[number]> {
  const values: unknown[] = [];
  for (const item of items) {
    if (!isVariant(item, "present")) return item as HaltOf<R[number]>;
    values.push(item.present);
  }
  return present(values as ValuesOf<R>);
}
