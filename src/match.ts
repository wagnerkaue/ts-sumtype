/** The payload type `matchTag` hands to the arm for tag `K`. */
export type HandlerPayload<V extends { tag: string }, K extends V["tag"]> =
  Extract<V, { tag: K }> extends Record<K, infer P> ? P : void;

/** Plain values `matchTag` accepts as a value arm. */
export type NotFnPrimitive = string | number | boolean | bigint | symbol | null | undefined;
/** Built-in object types treated as value arms rather than callables. */
export type NotFnBuiltin =
  | Date
  | RegExp
  | Error
  | Promise<unknown>
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>;
/** Anything `matchTag` treats as a value arm instead of calling it. */
export type NotFn = NotFnPrimitive | NotFnBuiltin | { [key: string]: unknown } | readonly unknown[];

/** One arm per tag of `V` — either a function receiving that tag's payload, or a plain value. */
export type CasesMixed<V extends { tag: string }> = {
  [K in V["tag"]]: ((payload: HandlerPayload<V, K>) => unknown) | NotFn;
};

/** The members of `V` whose tags aren't in `K` — what a fallback arm receives. */
export type Rest<V extends { tag: string }, K extends string> =
  Extract<V, { tag: Exclude<V["tag"], K> }>;

/** The union of every arm's result type, functions unwrapped to their return type. */
export type ArmResults<C> = {
  [K in keyof C]: C[K] extends (...args: any) => infer R ? R : C[K];
}[keyof C];

/** The result type of a fallback arm, function unwrapped to its return type. */
export type FallbackResult<F> = F extends (...args: any) => infer R ? R : F;

/** Exhaustive dispatch: one arm per tag of `value`'s union, function or plain value. */
export function matchTag<V extends { tag: string }, C extends CasesMixed<V>>(
  value: V,
  cases: C,
): ArmResults<C>;
/** Partial dispatch: arms for some tags, `fallback` receiving the unmatched member for the rest. */
export function matchTag<
  V extends { tag: string },
  C extends Partial<CasesMixed<V>>,
  F extends ((rest: Rest<V, keyof C & string>) => unknown) | NotFn,
>(value: V, cases: C, fallback: F): ArmResults<C> | FallbackResult<F>;
export function matchTag(value: any, cases: any, fallback?: any): any {
  if (Object.hasOwn(cases, value.tag)) {
    const handler = cases[value.tag];
    const payload = value.tag in value ? value[value.tag] : undefined;
    return typeof handler === "function" ? dispatch<any>(handler, payload) : handler;
  }
  return typeof fallback === "function" ? dispatch<any>(fallback, value) : fallback;
}

function dispatch<R>(handler: unknown, payload: unknown): R {
  return (handler as (p: unknown) => R)(payload);
}
