/** The type with exactly one value, `null`; the explicit spelling for a case that carries no payload. */
export type Unit = null;

/** The one value of `Unit`. */
export const unit: Unit = null;

/**
 * A union with one case per key of `Cases`: `{ readonly tag: K; readonly [K]: Cases[K] }`, for
 * every `K`, joined with `|`.
 *
 * Each case is a single object type rather than an intersection of a tag and a payload. That is
 * deliberate: TypeScript prints an intersection structurally, so building the case as
 * `{ readonly tag: K } & Pick<Cases, K>` put the whole encoding -- and the whole `Cases` object,
 * self-references included -- into every diagnostic mentioning a `Sum`, once per union member, at
 * every level of an elaboration chain. As one object type it prints as itself:
 * `{ readonly tag: "some"; readonly some: string; }`.
 *
 * The consequence is that the payload slot is `readonly` along with the tag; a mapped type applies
 * its modifier to every key, and a mixed pair is exactly what forced the intersection. The payload
 * is replaced by building a new case -- see `withPayload` -- not by assigning through the slot.
 * A payload's own fields are untouched: `expr.seq.left = x` still type checks. `Frozen<T>` is what
 * marks those, and everything below them, immutable too.
 */
export type Sum<Cases extends Record<string, unknown>> = {
  [K in keyof Cases]: { readonly [P in K | "tag"]: P extends "tag" ? K : Cases[K] };
}[keyof Cases];

/** Values with no properties to freeze. */
type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/** Built-ins `Frozen` passes through whole instead of mapping member by member. */
type Opaque = Date | RegExp | Error | Promise<unknown>;

/** Holds the element type behind an interface, so a recursive payload has somewhere to close its cycle. */
interface FrozenArray<Element> extends ReadonlyArray<Frozen<Element>> {}

/**
 * Marks every property `readonly` and every collection immutable, all the way down.
 * Wrap a sum type with it, `Frozen<Sum<{ ... }>>`, and each payload is frozen along with
 * the slot holding it. A sum type that already exists takes it too: `Frozen<Option<Row>>`.
 *
 * A recursive case works when its self-reference sits inside the case literal, which is
 * where `Frozen<Sum<{ seq: Term[]; rest: Term | null }>>` puts it. A recursive type
 * declared elsewhere behaves differently: `Frozen<Json>` rewrites the outermost layer and
 * then arrives back at `Json`, still mutable, so the result is not a fixed point and a
 * recursive function over it stops type checking. Declare those frozen instead, either
 * with the `readonly` markers written out or as a `Sum` whose cases are an object literal.
 *
 * Arrays become `readonly`, which TypeScript does check on assignment: a frozen payload
 * cannot be passed to a parameter typed `T[]`.
 */
export type Frozen<T> = T extends Primitive | Opaque
  ? T
  : T extends (...args: never[]) => unknown
    ? T
    : T extends ReadonlyMap<infer K, infer V>
      ? ReadonlyMap<Frozen<K>, Frozen<V>>
      : T extends ReadonlySet<infer E>
        ? ReadonlySet<Frozen<E>>
        : T extends readonly unknown[]
          ? number extends T["length"]
            ? FrozenArray<T[number]>
            : { readonly [K in keyof T]: Frozen<T[K]> }
          : { readonly [K in keyof T]: Frozen<T[K]> };

/** Rejects `Shape` unless it has exactly one key: the constraint `variant()`/`tagged()` build against. */
type SingleKeyed<Shape extends Record<string, unknown>, K = keyof Shape> =
  K extends keyof Shape ? ([Exclude<keyof Shape, K>] extends [never] ? Shape : never) : never;

/** Builds the one-case `Sum` for a single-key object: `variant({ paren: expr })`. */
export function variant<const Shape extends Record<string, unknown>>(
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
  function build<const Shape extends Record<string, unknown>>(
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
export function withPayload<const V extends { tag: string }>(
  original: V,
  newPayload: PayloadOf<V, V["tag"]>,
): V {
  return { tag: original.tag, [original.tag]: newPayload } as unknown as V;
}
