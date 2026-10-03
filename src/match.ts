import { type PayloadOf } from "./variant";
import { wrapError, type Result, type Wrapped } from "./result";
import { type Step } from "./flow";

/**
 * For each tag of `V`, a step taking that case's payload. The optional `tag` key marks this type:
 * no handlers object has one, since `tag` is never a case name, so `H` has it only when the
 * handlers were rejected and TypeScript fell back to this constraint. `Settled` reads that mark.
 */
type HandlersFor<V extends { tag: string }> = {
  readonly [K in V["tag"]]: (payload: PayloadOf<V, K>) => Result<unknown, unknown>;
} & { readonly tag?: never };
/**
 * Rules out a handler for a tag `V` doesn't have, which a constraint alone would accept: a sum that
 * loses a case would otherwise keep its handler around, unreachable.
 */
type NoOtherTags<V extends { tag: string }, H> = { readonly [K in Exclude<keyof H, V["tag"] | "tag">]: never };
/**
 * `T`, or `never` once the handlers were rejected. The error at the handler is already reported;
 * without this, the fallback's `unknown` output fails the declared type too, a second error about
 * the same mistake, and the first one a reader sees.
 */
type Settled<H, T> = "tag" extends keyof H ? never : T;
type OkOf<R> = R extends { readonly tag: "ok"; readonly ok: infer T } ? T : never;
type ErrorOf<R> = R extends { readonly tag: "error"; readonly error: infer E } ? E : never;
/** What any of the handlers succeeds with. */
type OutputOf<H> = { [K in keyof H]: H[K] extends (payload: never) => infer R ? OkOf<R> : never }[keyof H];
/** Each handler's error wrapped under its tag, with no case for a handler that can't fail. */
type WrappedErrorOf<H> = {
  [K in keyof H & string]: H[K] extends (payload: never) => infer R ? Wrapped<K, ErrorOf<R>> : never;
}[keyof H & string];

/**
 * A step over the sum `V` that hands each case's payload to the handler for its tag, wrapping the
 * handler's error under that tag. Like `tryFlow`, it is assigned to a constant with a declared type,
 * which is where `V` and each handler's payload type come from:
 *
 * ```ts
 * const fee: (method: PaymentMethod) => Result<number, Sum<{ creditCard: CardErr }>> = tryMatch({
 *   cash: () => ok(0),
 *   paypal: () => ok(0.029),
 *   creditCard: (card) => cardFee(card),
 *   crypto: () => ok(0.01),
 * });
 * ```
 */
export function tryMatch<V extends { tag: string }, const H extends HandlersFor<V>>(
  handlers: H & NoInfer<NoOtherTags<V, H>>,
): Step<V, Settled<H, OutputOf<H>>, Settled<H, WrappedErrorOf<H>>> {
  return (value) => {
    // Casts: choosing a handler by the tag at runtime is not something the types can follow.
    const handler = (handlers as Readonly<Record<string, (payload: unknown) => Result<unknown, unknown>>>)[value.tag];
    const payload = (value as unknown as Readonly<Record<string, unknown>>)[value.tag];
    return wrapError(handler(payload), value.tag) as never;
  };
}
