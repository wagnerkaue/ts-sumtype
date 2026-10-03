// @case    flow-in-generic-fn
// @feature flow() with generic steps
// @kind    baseline
// @title   flow called on steps whose types are unresolved generics
// @intent  Write a reusable helper that extends whatever step it is handed.

import { flow, map, type Step } from "ts-sumtype";

export function measured<T>(step: Step<string, T, string>): Step<string, number, string> {
  return flow(step, map((x) => String(x)), map((s) => s.length));
}
