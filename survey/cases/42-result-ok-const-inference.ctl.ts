// @case    result-ok-const-inference
// @feature `as const` object literal
// @kind    mistake
// @title   Array payload comes back readonly
// @intent  Wrap an array in a success object and hand it to an existing helper typed `number[]`.

declare function total(xs: number[]): number;

const r = { ok: true, value: [1, 2, 3] } as const;

export const sum = total(r.value);
