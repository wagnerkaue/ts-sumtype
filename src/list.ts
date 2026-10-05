import { variant } from "./variant";
import { ok, err, isErr, type Fallible, type Result, type Located, type Wrapped } from "./result";

function failedAt(tag: string, at: unknown, error: unknown): Result<never, unknown> {
  return err(variant(tag, { at, error }));
}

/**
 * Folds `f` over the items from `initial`. Fails at the first item that fails, with its error under
 * `tag`, located at the item's index or at `at(item)`.
 */
export function tryReduce<N, A, E, const K extends string>(
  f: (accumulated: A, item: N) => Result<A, E>,
  initial: A,
  tag: K,
): Fallible<readonly N[], A, Wrapped<K, Located<number, E>>>;
export function tryReduce<N, A, E, L, const K extends string>(
  f: (accumulated: A, item: N) => Result<A, E>,
  initial: A,
  tag: K,
  at: (item: N) => L,
): Fallible<readonly N[], A, Wrapped<K, Located<L, E>>>;
export function tryReduce(
  f: (accumulated: unknown, item: unknown) => Result<unknown, unknown>,
  initial: unknown,
  tag: string,
  at?: (item: unknown) => unknown,
): Fallible<readonly unknown[], unknown, unknown> {
  return (items) => {
    let accumulated = initial;
    for (let index = 0; index < items.length; index++) {
      const result = f(accumulated, items[index]);
      if (isErr(result)) return failedAt(tag, at === undefined ? index : at(items[index]), result.error);
      accumulated = result.ok;
    }
    return ok(accumulated);
  };
}

/**
 * Runs `f` on every item, collecting what each returns. Fails at the first item that fails, with its
 * error under `tag`, located at the item's index or at `at(item)`.
 */
export function tryMap<N, B, E, const K extends string>(
  f: Fallible<N, B, E>,
  tag: K,
): Fallible<readonly N[], readonly B[], Wrapped<K, Located<number, E>>>;
export function tryMap<N, B, E, L, const K extends string>(
  f: Fallible<N, B, E>,
  tag: K,
  at: (item: N) => L,
): Fallible<readonly N[], readonly B[], Wrapped<K, Located<L, E>>>;
export function tryMap(
  f: Fallible<unknown, unknown, unknown>,
  tag: string,
  at?: (item: unknown) => unknown,
): Fallible<readonly unknown[], readonly unknown[], unknown> {
  return (items) => {
    const collected: unknown[] = [];
    for (let index = 0; index < items.length; index++) {
      const result = f(items[index]);
      if (isErr(result)) return failedAt(tag, at === undefined ? index : at(items[index]), result.error);
      collected.push(result.ok);
    }
    return ok(collected);
  };
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
