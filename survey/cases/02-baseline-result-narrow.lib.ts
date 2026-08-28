// @case    baseline-result-narrow
// @feature Result narrowing
// @kind    baseline
// @title   Correct narrowing before reading the payload
// @intent  Reference point: guard, then read.

import { isErr, type Result } from "ts-sumtype";

declare const r: Result<number, string>;

export function read(): number {
  if (isErr(r)) return -1;
  return r.ok;
}
