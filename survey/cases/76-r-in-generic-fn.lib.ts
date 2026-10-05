// @case    r-in-generic-fn
// @feature r with generic types
// @kind    baseline
// @title   r in a function whose types are unresolved generics
// @intent  Write a reusable helper that measures what any fallible function returns, wrapping its error.

import { r, type Result, type Sum } from "ts-sumtype";

export function measured<T, E>(f: (raw: string) => Result<T, E>, raw: string): Result<number, Sum<{ inner: E }>> {
  return r(($) => String($.try(f(raw), "inner")).length);
}
