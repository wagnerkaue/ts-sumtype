// @case    result-read-without-narrowing
// @feature hand-rolled Result
// @kind    mistake
// @title   Payload read straight off a Result
// @intent  Use the success value without checking for the error case first.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

declare const r: Res<number>;

export const n = r.value;
