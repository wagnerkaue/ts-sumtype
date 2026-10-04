import { type PayloadOf } from "./variant";
import { wrapError, type Result, type Wrapped } from "./result";
import { type Fallible } from "./flow";

/**
 * For each tag of `V`, a handler taking that case's payload and returning an `R`. No handlers
 * object has a `tag` key, so `H` has one only when TypeScript rejected the handlers and fell back
 * to this constraint, which is what `Settled` reads.
 */
type HandlersFor<V extends { tag: string }, R> = {
  readonly [K in V["tag"]]: (payload: PayloadOf<V, K>) => R;
} & { readonly tag?: never };
/** A key of `H` that isn't a tag of `V` must be `never`, which no handler is. */
type NoOtherTags<V extends { tag: string }, H> = { readonly [K in Exclude<keyof H, V["tag"] | "tag">]: never };
/** `T`, or `never` for rejected handlers, so the mistake is reported once, at the handler. */
type Settled<H, T> = "tag" extends keyof H ? never : T;
type ReturnOf<H> = ReturnOfHandler<H[keyof H]>;
type ReturnOfHandler<F> = F extends (payload: never) => infer R ? R : never;
type OkOf<R> = R extends { readonly tag: "ok"; readonly ok: infer T } ? T : never;
type ErrorOf<R> = R extends { readonly tag: "error"; readonly error: infer E } ? E : never;
type WrappedErrorOf<H> = {
  [K in keyof H & string]: H[K] extends (payload: never) => infer R ? Wrapped<K, ErrorOf<R>> : never;
}[keyof H & string];

function dispatch(handlers: object, value: { tag: string }): unknown {
  // Casts: choosing a handler by the tag at runtime is not something the types can follow.
  const handler = (handlers as Readonly<Record<string, (payload: unknown) => unknown>>)[value.tag];
  return handler((value as unknown as Readonly<Record<string, unknown>>)[value.tag]);
}

/**
 * A function over the sum `V` that hands each case's payload to the handler for its tag. Assigned
 * to a constant with a declared type, each handler takes its payload type from that declaration.
 */
export function match<V extends { tag: string }, const H extends HandlersFor<V, unknown>>(
  handlers: H & NoInfer<NoOtherTags<V, H>>,
): (value: V) => Settled<H, ReturnOf<H>> {
  return (value) => dispatch(handlers, value) as never;
}

/**
 * `match` for fallible handlers: the handler's error comes back wrapped under its tag, and a
 * handler that can't fail adds no error case.
 */
export function tryMatch<V extends { tag: string }, const H extends HandlersFor<V, Result<unknown, unknown>>>(
  handlers: H & NoInfer<NoOtherTags<V, H>>,
): Fallible<V, Settled<H, OkOf<ReturnOf<H>>>, Settled<H, WrappedErrorOf<H>>> {
  return (value) => wrapError(dispatch(handlers, value) as Result<unknown, unknown>, value.tag) as never;
}
