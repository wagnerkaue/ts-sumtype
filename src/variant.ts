/** A case with a `tag` naming it and a payload stored under a key named after that tag. */
export type Variant<K extends string, T = undefined> = {
  readonly tag: K;
} & {
  readonly [P in K]: T;
};

/** Builds a `Variant` with no payload. */
export function variant<K extends string>(tag: K): Variant<K>;
/** Builds a `Variant` carrying `payload` under the tag-named key. */
export function variant<K extends string, T>(tag: K, payload: T): Variant<K, T>;
export function variant(tag: string, ...args: unknown[]): unknown {
  return { tag, [tag]: args[0] };
}

/** Type guard: true when `v.tag` is one of `tags`, narrowing `v` to that member. */
export function isVariant<V extends { tag: string }, const K extends V["tag"]>(
  v: V,
  ...tags: K[]
): v is Extract<V, { tag: K }> {
  return (tags as readonly string[]).includes(v.tag);
}

/** The union of tags a `Variant` union can carry. */
export type TagOf<V extends { tag: string }> = V["tag"];
/** The member of `V` whose tag is `K`. */
export type ExtractVariant<V extends { tag: string }, K extends TagOf<V>> = Extract<V, { tag: K }>;
/** The payload type of the member of `V` tagged `K`. */
export type PayloadOf<V extends { tag: string }, K extends TagOf<V>> =
  K extends unknown ? (ExtractVariant<V, K> extends Record<K, infer T> ? T : never) : never;

/** A `Variant` nested one level per entry in `Tags`, with `Inner` at the center. */
export type NestVariant<Tags extends readonly string[], Inner> =
  Tags extends readonly [infer Head extends string, ...infer Rest extends string[]]
    ? Variant<Head, NestVariant<Rest, Inner>>
    : Inner;

/** Builds a constructor that nests every `Variant` it makes under the given outer tags, in order. */
export function tagged<const Prefixes extends readonly string[]>(...prefixes: Prefixes) {
  function build<K extends string>(tag: K): NestVariant<Prefixes, Variant<K>>;
  function build<K extends string, T>(tag: K, payload: T): NestVariant<Prefixes, Variant<K, T>>;
  function build(tag: string, ...args: unknown[]): unknown {
    let result: unknown = { tag, [tag]: args[0] };
    for (let i = prefixes.length - 1; i >= 0; i--) {
      const prefix = prefixes[i];
      result = { tag: prefix, [prefix]: result };
    }
    return result;
  }
  return build;
}

/** Returns a copy of `original` with its payload replaced by `newPayload`; the tag is unchanged. */
export function withPayload<V extends { tag: string }>(
    original: V,
    newPayload: PayloadOf<V, V["tag"]>
): V {
    return { tag: original.tag, [original.tag]: newPayload } as unknown as V;
}
