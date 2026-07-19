import { type Variant } from "./variant";

/** A flat discriminated union member, with the discriminant moved under its own value as the tag-named key. */
export type Unflattened<K extends string, T extends Record<K, string>> = T extends any
  ? Variant<T[K], Omit<T, K>>
  : never;

/** Returns a reusable converter from a flat discriminated union (keyed by `key`) to `Variant`. */
export function fromFlat<K extends string>(
  key: K,
): <T extends Record<K, string>>(value: T) => Unflattened<K, T>;
/** Converts a flat discriminated union value — keyed by `key` — into a `Variant`. */
export function fromFlat<K extends string, T extends Record<K, string>>(
  key: K,
  value: T,
): Unflattened<K, T>;
export function fromFlat(key: string, value?: unknown): unknown {
  if (arguments.length < 2) {
    return (v: unknown) => fromFlat(key, v as Record<string, string>);
  }
  const { [key]: tag, ...payload } = value as Record<string, unknown>;
  return { tag, [tag as string]: payload };
}

/** A union member already nested under its own tag/payload key names, renamed to `tag`/tag-named key. */
export type Rekeyed<
  K extends string,
  P extends string,
  T extends Record<K, string> & Record<P, unknown>,
> = T extends any ? Variant<T[K], T[P]> : never;

/** Returns a reusable converter from data keyed by `tagKey`/`payloadKey` to `Variant`. */
export function fromKeyed<K extends string, P extends string>(
  tagKey: K,
  payloadKey: P,
): <T extends Record<K, string> & Record<P, unknown>>(value: T) => Rekeyed<K, P, T>;
/** Renames a value's `tagKey`/`payloadKey` fields to `tag` and a tag-named key. */
export function fromKeyed<
  K extends string,
  P extends string,
  T extends Record<K, string> & Record<P, unknown>,
>(tagKey: K, payloadKey: P, value: T): Rekeyed<K, P, T>;
export function fromKeyed(tagKey: string, payloadKey: string, value?: unknown): unknown {
  if (arguments.length < 3) {
    return (v: unknown) => fromKeyed(tagKey, payloadKey, v as Record<string, string>);
  }
  const obj = value as Record<string, unknown>;
  const tag = obj[tagKey] as string;
  return { tag, [tag]: obj[payloadKey] };
}

/** Converts a bare string-literal value into its unit `Variant`. */
export function fromEnum<K extends string>(value: K): Variant<K> {
  return { tag: value, [value]: undefined } as Variant<K>;
}
