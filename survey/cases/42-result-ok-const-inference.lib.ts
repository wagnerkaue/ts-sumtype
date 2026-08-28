// @case    result-ok-const-inference
// @feature ok() const inference
// @kind    mistake
// @title   Array payload comes back readonly
// @intent  Wrap an array in ok() and hand it to an existing helper typed `number[]`.

import { ok } from "ts-sumtype";

declare function total(xs: number[]): number;

const r = ok([1, 2, 3]);

export const sum = total(r.ok);
