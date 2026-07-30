import { unit, type Sum, type Unit } from "./variant";

/** A flat discriminated union member, with the discriminant moved under its own value as the tag-named key. */
export type Unflattened<K extends string, T extends Record<K, string>> = T extends any
  ? Sum<Record<T[K], Omit<T, K>>>
  : never;

/** Returns a converter from a flat discriminated union (keyed by `key`) to a `Sum` case. */
export function fromFlat<K extends string>(
  key: K,
): <T extends Record<K, string>>(value: T) => Unflattened<K, T> {
  return (value) => {
    const { [key]: tag, ...payload } = value as Record<string, unknown>;
    return { tag, [tag as string]: payload } as Unflattened<K, typeof value>;
  };
}

/** A union member already nested under its own tag/payload key names, renamed to `tag`/tag-named key. */
export type Rekeyed<
  K extends string,
  P extends string,
  T extends Record<K, string> & Record<P, unknown>,
> = T extends any ? Sum<Record<T[K], T[P]>> : never;

/** Returns a converter from data keyed by `tagKey`/`payloadKey` to a `Sum` case. */
export function fromKeyed<K extends string, P extends string>(
  tagKey: K,
  payloadKey: P,
): <T extends Record<K, string> & Record<P, unknown>>(value: T) => Rekeyed<K, P, T> {
  return (value) => {
    const obj = value as Record<string, unknown>;
    const tag = obj[tagKey] as string;
    return { tag, [tag]: obj[payloadKey] } as Rekeyed<K, P, typeof value>;
  };
}

/** Converts a bare string-literal value into its unit `Sum` case. */
export function fromEnum<K extends string>(
  value: K,
): K extends any ? Sum<Record<K, Unit>> : never {
  return { tag: value, [value]: unit } as K extends any ? Sum<Record<K, Unit>> : never;
}
