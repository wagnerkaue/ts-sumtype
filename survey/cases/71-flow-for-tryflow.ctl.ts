// @case    flow-for-tryflow
// @feature nested calls
// @kind    mistake
// @title   Steps composed with flow instead of tryFlow
// @intent  Reject a negative number, then add one; the second step receives the first step's whole Result.

type Res<T> = { ok: true; value: T } | { ok: false; error: "negative" };

const rejectNegative = (n: number): Res<number> => (n < 0 ? { ok: false, error: "negative" } : { ok: true, value: n });

export const run = (n: number): Res<number> => ({ ok: true, value: rejectNegative(n) + 1 });
