import { ok, err, isErr, type Fallible, type Result, type Located } from "./result";

/**
 * Folds `f` over `items` from `initial`. Fails at the first item that fails, with its error located
 * at the item's index or at `at(item)`. The caller wraps it under its own tag, usually through `$.try`.
 */
export function tryReduce<N, A, E = never>(
  items: readonly N[],
  f: (accumulated: A, item: N) => Result<A, E>,
  initial: A,
): Result<A, Located<number, E>>;
export function tryReduce<N, A, L, E = never>(
  items: readonly N[],
  f: (accumulated: A, item: N) => Result<A, E>,
  initial: A,
  at: (item: N) => L,
): Result<A, Located<L, E>>;
export function tryReduce(
  items: readonly unknown[],
  f: (accumulated: unknown, item: unknown) => Result<unknown, unknown>,
  initial: unknown,
  at?: (item: unknown) => unknown,
): Result<unknown, unknown> {
  let accumulated = initial;
  for (let index = 0; index < items.length; index++) {
    const result = f(accumulated, items[index]);
    if (isErr(result)) return err({ at: at === undefined ? index : at(items[index]), error: result.error });
    accumulated = result.ok;
  }
  return ok(accumulated);
}

/**
 * Runs `f` on every item, collecting what each returns. Fails at the first item that fails, with its
 * error located at the item's index or at `at(item)`.
 */
export function tryMap<N, B, E = never>(items: readonly N[], f: Fallible<N, B, E>): Result<readonly B[], Located<number, E>>;
export function tryMap<N, B, L, E = never>(
  items: readonly N[],
  f: Fallible<N, B, E>,
  at: (item: N) => L,
): Result<readonly B[], Located<L, E>>;
export function tryMap(
  items: readonly unknown[],
  f: Fallible<unknown, unknown, unknown>,
  at?: (item: unknown) => unknown,
): Result<readonly unknown[], unknown> {
  const collected: unknown[] = [];
  for (let index = 0; index < items.length; index++) {
    const result = f(items[index]);
    if (isErr(result)) return err({ at: at === undefined ? index : at(items[index]), error: result.error });
    collected.push(result.ok);
  }
  return ok(collected);
}

/**
 * Runs `f` on every item and concatenates what each returns. Fails at the first item that fails, with
 * its error located at the item's index or at `at(item)`.
 */
export function tryFlatMap<N, U, E = never>(
  items: readonly N[],
  f: Fallible<N, readonly U[], E>,
): Result<readonly U[], Located<number, E>>;
export function tryFlatMap<N, U, L, E = never>(
  items: readonly N[],
  f: Fallible<N, readonly U[], E>,
  at: (item: N) => L,
): Result<readonly U[], Located<L, E>>;
export function tryFlatMap(
  items: readonly unknown[],
  f: Fallible<unknown, readonly unknown[], unknown>,
  at?: (item: unknown) => unknown,
): Result<readonly unknown[], unknown> {
  const collected: unknown[] = [];
  for (let index = 0; index < items.length; index++) {
    const result = f(items[index]);
    if (isErr(result)) return err({ at: at === undefined ? index : at(items[index]), error: result.error });
    collected.push(...result.ok);
  }
  return ok(collected);
}
