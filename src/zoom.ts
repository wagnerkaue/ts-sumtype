import { ok, isOk } from "./result";
import { type Step } from "./flow";

/** `S` with the part at `K` replaced by a `B`: one key of an object, or one index of a tuple. */
export type Replace<S, K extends keyof S, B> = {
  [P in keyof S]: P extends K | `${K & number}` ? B : S[P];
};

function replace<S, K extends keyof S, B>(whole: S, key: K, part: B): Replace<S, K, B> {
  return (Array.isArray(whole) ? whole.with(key as number, part) : { ...whole, [key]: part }) as Replace<S, K, B>;
}

/**
 * Runs `step` on the part of `whole` at `key`, rebuilding the whole around what it returns. A
 * deeper part is reached by nesting: `zoom("payment", zoom("card", zoom("number", parse)))`.
 */
export function zoom<S, const K extends keyof S, B, E>(key: K, step: Step<S[K], B, E>): Step<S, Replace<S, K, B>, E> {
  // One key, not a path: nested calls keep autocomplete on every key and report a wrong one where
  // it is written, listing the valid keys. A path array reports every segment as `never`.
  return (whole) => {
    const result = step(whole[key]);
    return isOk(result) ? ok(replace(whole, key, result.ok)) : result;
  };
}

/** `zoom` with a plain function: updates the part of `whole` at `key`, rebuilding the whole. */
export function over<S, const K extends keyof S, B>(key: K, f: (part: S[K]) => B): (whole: S) => Replace<S, K, B> {
  return (whole) => replace(whole, key, f(whole[key]));
}
