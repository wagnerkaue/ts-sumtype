import { ok, isOk } from "./result";
import { type Fallible } from "./flow";

/** `S` with the part at `K` replaced by a `B`: one key of an object, or one index of a tuple. */
export type Replace<S, K extends keyof S, B> = {
  [P in keyof S]: P extends K | `${K & number}` ? B : S[P];
};

function replace<S, K extends keyof S, B>(whole: S, key: K, part: B): Replace<S, K, B> {
  return (Array.isArray(whole) ? whole.with(key as number, part) : { ...whole, [key]: part }) as Replace<S, K, B>;
}

/**
 * Updates the part of `whole` at `key`, rebuilding the whole around the result. A deeper part is
 * reached by nesting: `over("card", over("number", Number))`.
 */
export function over<S, const K extends keyof S, B>(key: K, f: (part: S[K]) => B): (whole: S) => Replace<S, K, B> {
  // One key per call, not a path: nesting keeps autocomplete on each key, where a path array would
  // report a misspelled key as `never`.
  return (whole) => replace(whole, key, f(whole[key]));
}

/** `over` for a fallible function: a success is rebuilt into the whole, and an error passes through. */
export function tryOver<S, const K extends keyof S, B, E>(key: K, f: Fallible<S[K], B, E>): Fallible<S, Replace<S, K, B>, E> {
  return (whole) => {
    const result = f(whole[key]);
    return isOk(result) ? ok(replace(whole, key, result.ok)) : result;
  };
}
