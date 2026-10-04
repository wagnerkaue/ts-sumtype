import { variant } from "./variant";
import { ok, err, isErr, type Result, type Located, type Wrapped } from "./result";
import { type Fallible } from "./flow";

function failedAt(tag: string, at: unknown, error: unknown): Result<never, unknown> {
  return err(variant(tag, { at, error }));
}

/**
 * Runs `f` on every item and concatenates what each returns. Fails at the first item that fails, with
 * its error under `tag`, located at the item's index or at `at(item)`.
 */
export function tryFlatMap<N, U, E, const K extends string>(
  f: Fallible<N, readonly U[], E>,
  tag: K,
): Fallible<readonly N[], readonly U[], Wrapped<K, Located<number, E>>>;
export function tryFlatMap<N, U, E, L, const K extends string>(
  f: Fallible<N, readonly U[], E>,
  tag: K,
  at: (item: N) => L,
): Fallible<readonly N[], readonly U[], Wrapped<K, Located<L, E>>>;
export function tryFlatMap(
  f: Fallible<unknown, readonly unknown[], unknown>,
  tag: string,
  at?: (item: unknown) => unknown,
): Fallible<readonly unknown[], readonly unknown[], unknown> {
  return (items) => {
    const collected: unknown[] = [];
    for (let index = 0; index < items.length; index++) {
      const result = f(items[index]);
      if (isErr(result)) return failedAt(tag, at === undefined ? index : at(items[index]), result.error);
      collected.push(...result.ok);
    }
    return ok(collected);
  };
}
