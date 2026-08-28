// @case    allerrors-varargs
// @feature hand-written collector
// @kind    mistake
// @title   Results passed as separate arguments
// @intent  Collect the errors from several results; the author passes them varargs-style instead of as one array.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

declare function allErrors(results: Res<unknown>[]): Res<unknown[]>;

export const out = allErrors({ ok: true, value: 1 }, { ok: false, error: "bad" });
