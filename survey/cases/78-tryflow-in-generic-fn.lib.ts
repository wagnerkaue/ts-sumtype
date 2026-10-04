// @case    tryflow-in-generic-fn
// @feature tryFlow() with generic steps
// @kind    baseline
// @title   tryFlow called on steps whose types are unresolved generics
// @intent  Write a reusable helper that extends whatever step it is handed.

import { tryFlow, step, type Fallible } from "ts-sumtype";

export function measured<T>(f: Fallible<string, T, string>): Fallible<string, number, string> {
  return tryFlow(f, step((x) => String(x)), step((s) => s.length));
}
