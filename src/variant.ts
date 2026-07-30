/** The type with exactly one value, `null`; the explicit spelling for a case that carries no payload. */
export type Unit = null;

/** The one value of `Unit`. */
export const unit: Unit = null;

/** A union with one case per key of `Cases`: `{ tag: K } & Pick<Cases, K>`, for every `K`, joined with `|`. */
export type Sum<Cases extends Record<string, unknown>> = {
  [K in keyof Cases]: { readonly tag: K } & Pick<Cases, K>;
}[keyof Cases];

/** Rejects `Shape` unless it has exactly one key — the constraint `variant()`/`tagged()` build against. */
type SingleKeyed<Shape extends Record<string, unknown>, K = keyof Shape> =
  K extends keyof Shape ? ([Exclude<keyof Shape, K>] extends [never] ? Shape : never) : never;

/** Builds the one-case `Sum` for a single-key object: `variant({ paren: expr })`. */
export function variant<Shape extends Record<string, unknown>>(
  shape: Shape & SingleKeyed<Shape>,
): Sum<Shape> {
  const tag = Object.keys(shape)[0] as keyof Shape;
  return { tag, ...(shape as object) } as Sum<Shape>;
}

/** Type guard: true when `v.tag` is one of `tags`, narrowing `v` to that member. */
export function isVariant<V extends { tag: string }, const K extends V["tag"]>(
  v: V,
  ...tags: K[]
): v is Extract<V, { tag: K }> {
  return (tags as readonly string[]).includes(v.tag);
}

/** The union of tags a `Sum`/tagged union can carry. */
export type TagOf<V extends { tag: string }> = V["tag"];
/** The member of `V` whose tag is `K`. */
export type ExtractVariant<V extends { tag: string }, K extends TagOf<V>> = Extract<V, { tag: K }>;
/** The payload type of the member of `V` tagged `K`. */
export type PayloadOf<V extends { tag: string }, K extends TagOf<V>> =
  K extends unknown ? (ExtractVariant<V, K> extends Record<K, infer T> ? T : never) : never;

/** A single case nested one level per entry in `Tags`, with `Inner` at the center. */
export type NestVariant<Tags extends readonly string[], Inner> =
  Tags extends readonly [infer Head extends string, ...infer Rest extends string[]]
    ? Sum<Record<Head, NestVariant<Rest, Inner>>>
    : Inner;

/** Builds a constructor that nests every case it makes under the given outer tags, in order. */
export function tagged<const Prefixes extends readonly string[]>(...prefixes: Prefixes) {
  function build<Shape extends Record<string, unknown>>(
    shape: Shape & SingleKeyed<Shape>,
  ): NestVariant<Prefixes, Sum<Shape>> {
    const tag = Object.keys(shape)[0];
    let result: unknown = { tag, ...(shape as object) };
    for (let i = prefixes.length - 1; i >= 0; i--) {
      const prefix = prefixes[i];
      result = { tag: prefix, [prefix]: result };
    }
    return result as NestVariant<Prefixes, Sum<Shape>>;
  }
  return build;
}

/** Returns a copy of `original` with its payload replaced by `newPayload`; the tag is unchanged. */
export function withPayload<V extends { tag: string }>(
  original: V,
  newPayload: PayloadOf<V, V["tag"]>,
): V {
  return { tag: original.tag, [original.tag]: newPayload } as unknown as V;
}
