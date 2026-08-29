// @case    pipe-in-generic-fn
// @feature pipe() with a generic seed
// @kind    baseline
// @title   pipe called on an unresolved generic
// @intent  Write a reusable helper that pipes whatever Result it is handed. Probes the soundness constraint documented in src/pipe.ts: the seed's type is inferred from the first step rather than unwrapped by a conditional type, so a bare generic seed is expected to work.

import { pipe, type Result } from "ts-sumtype";

export function describe<T>(r: Result<T, string>) {
  return pipe(r, (x) => String(x), (s) => s.length);
}
