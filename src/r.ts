import { variant, unit, type Unit } from "./variant";
import { ok, err, isOk, type Result } from "./result";

type TagIn<E> = E extends { readonly tag: infer K extends string } ? K : never;
type PayloadIn<E, K> = E extends { readonly tag: K } ? E[K & keyof E] : never;
type UnitTagIn<E> = { [K in TagIn<E>]: [PayloadIn<E, K>] extends [Unit] ? K : never }[TagIn<E>];

/** What `r` hands its body: the two ways to leave it with an error of type `E`. */
export type Failing<E> = {
  /** Leaves the body with the case `tag` of `E`. Written `return $.fail(...)`. */
  readonly fail: {
    (tag: UnitTagIn<E>): never;
    <const K extends TagIn<E>>(tag: K, payload: PayloadIn<E, K>): never;
  };
  /** The success value of `result`, or leaves the body with its error under `tag`. */
  readonly try: <T, const K extends TagIn<E>>(result: Result<T, NoInfer<PayloadIn<E, K>>>, tag: K) => T;
};

class Failure {
  readonly owner: symbol;
  readonly error: unknown;

  constructor(owner: symbol, error: unknown) {
    this.owner = owner;
    this.error = error;
  }
}

/**
 * Runs `body` and returns its outcome as a `Result`: what it returns is the success value, and
 * `$.try` and `$.fail` leave it with an error. Both are typed by the declared return type the
 * result is returned as, which is what checks each tag and payload where it's written.
 *
 * `return $.fail(...)`: TypeScript ends a code path at a call returning `never` only when the
 * function has a declared type, which a parameter's method doesn't.
 */
export function r<T, E = never>(body: ($: Failing<E>) => NoInfer<T>): Result<T, E> {
  const owner = Symbol("r");
  const fail = (tag: string, payload: unknown = unit): never => {
    throw new Failure(owner, variant(tag, payload));
  };
  const tryResult = <U>(result: Result<U, unknown>, tag: string): U =>
    isOk(result) ? result.ok : fail(tag, (result as { error: unknown }).error);
  try {
    return ok(body({ fail, try: tryResult } as Failing<E>));
  } catch (thrown) {
    if (thrown instanceof Failure && thrown.owner === owner) return err(thrown.error) as Result<T, E>;
    throw thrown;
  }
}
