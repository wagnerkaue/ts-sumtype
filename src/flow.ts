import { variant, unit, type Sum, type Unit } from "./variant";
import { ok, err, isErr, wrapError, type Result, type At, type Wrapped } from "./result";
import { some, none, isSome, type Option } from "./option";
import { type Entry } from "./entry";

/** One link of a chain: takes the previous link's value and succeeds with the next, or fails. */
export type Step<A, B, E> = (input: A) => Result<B, E>;

/**
 * Composes steps left to right into one step that stops at the first error. The chain is built
 * once, assigned to a constant with a declared type, and each step infers its types from it:
 *
 * ```ts
 * const listed: (items: readonly string[]) => Result<string, Sum<{ empty: Unit }>> = tryFlow(
 *   rejectIf((items) => items.length === 0, "empty"),
 *   map((items) => items.join(", ")),
 * );
 * ```
 */
export function tryFlow<A, B, E1>(s1: Step<A, B, E1>): Step<A, B, E1>;
export function tryFlow<A, B, C, E1, E2>(s1: Step<A, B, E1>, s2: Step<B, C, E2>): Step<A, C, E1 | E2>;
export function tryFlow<A, B, C, D, E1, E2, E3>(
  s1: Step<A, B, E1>,
  s2: Step<B, C, E2>,
  s3: Step<C, D, E3>,
): Step<A, D, E1 | E2 | E3>;
export function tryFlow<A, B, C, D, F, E1, E2, E3, E4>(
  s1: Step<A, B, E1>,
  s2: Step<B, C, E2>,
  s3: Step<C, D, E3>,
  s4: Step<D, F, E4>,
): Step<A, F, E1 | E2 | E3 | E4>;
export function tryFlow<A, B, C, D, F, G, E1, E2, E3, E4, E5>(
  s1: Step<A, B, E1>,
  s2: Step<B, C, E2>,
  s3: Step<C, D, E3>,
  s4: Step<D, F, E4>,
  s5: Step<F, G, E5>,
): Step<A, G, E1 | E2 | E3 | E4 | E5>;
export function tryFlow<A, B, C, D, F, G, H, E1, E2, E3, E4, E5, E6>(
  s1: Step<A, B, E1>,
  s2: Step<B, C, E2>,
  s3: Step<C, D, E3>,
  s4: Step<D, F, E4>,
  s5: Step<F, G, E5>,
  s6: Step<G, H, E6>,
): Step<A, H, E1 | E2 | E3 | E4 | E5 | E6>;
export function tryFlow(...steps: readonly Step<unknown, unknown, unknown>[]): Step<unknown, unknown, unknown> {
  return (input) => {
    // A loop, not `reduce`: that adds two stack frames (`reduce` and its callback) to every chain a
    // recursive step passes through, and recursion in this style already runs deep.
    let result: Result<unknown, unknown> = ok(input);
    for (const step of steps) {
      if (isErr(result)) return result;
      result = step(result.ok);
    }
    return result;
  };
}

/** A plain function as a step that can't fail. */
export function map<A, B>(f: (input: A) => B): Step<A, B, never> {
  return (input) => ok(f(input));
}

/** A step putting `first` ahead of the list it is given. */
export function prepend<T>(first: readonly T[]): Step<readonly T[], readonly T[], never> {
  return (rest) => ok([...first, ...rest]);
}

/** Runs `step`, wrapping its error under `tag`. A step that can't fail stays one. */
export function attempt<A, B, E, const K extends string>(step: Step<A, B, E>, tag: K): Step<A, B, Wrapped<K, E>> {
  return (input) => wrapError(step(input), tag);
}

/**
 * Fails under `tag` with the problem `problem` finds, or passes the input on when it finds none:
 * `rejectWith((path) => fromNullable(path.find(hasDot)), "dotInSegment")`.
 */
export function rejectWith<A, P, const K extends string>(
  problem: (input: A) => Option<P>,
  tag: K,
): Step<A, A, Sum<Record<K, P>>> {
  return (input) => {
    const found = problem(input);
    return isSome(found) ? err(variant(tag, found.some)) : ok(input);
  };
}

/** Fails under `tag` when `fails` holds, or passes the input on: `rejectWith` with no payload. */
export function rejectIf<A, const K extends string>(
  fails: (input: A) => boolean,
  tag: K,
): Step<A, A, Sum<Record<K, Unit>>> {
  return rejectWith((input: A) => (fails(input) ? some(unit) : none()), tag);
}

/** `At<string, E>`, or `never` when `E` is, so a step that can't fail locates nothing. */
type AtKey<E> = [E] extends [never] ? never : At<string, E>;

/**
 * Runs `step` on every entry and concatenates what each returns. Fails at the first entry that
 * fails, with its error located by the entry's key under `tag`.
 */
export function tryFlatMap<N extends Entry<unknown>, U, E, const K extends string>(
  step: Step<N, readonly U[], E>,
  tag: K,
): Step<readonly N[], readonly U[], Wrapped<K, AtKey<E>>> {
  return (items) => {
    const collected: U[] = [];
    for (const item of items) {
      const result = step(item);
      // The cast is sound: an error exists here, so `E` is not `never`.
      if (isErr(result)) return err(variant(tag, { at: item.key, error: result.error })) as never;
      collected.push(...result.ok);
    }
    return ok(collected);
  };
}
