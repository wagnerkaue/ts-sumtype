// @case    baseline-result-narrow
// @feature hand-rolled Result narrowing
// @kind    baseline
// @title   Correct narrowing before reading the payload
// @intent  Reference point: guard, then read.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

declare const r: Res<number>;

export function read(): number {
  if (!r.ok) return -1;
  return r.value;
}
