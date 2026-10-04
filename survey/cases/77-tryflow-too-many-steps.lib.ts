// @case    tryflow-too-many-steps
// @feature tryFlow() overload table
// @kind    mistake
// @title   Seven steps, one past the overload table
// @intent  Chain seven transformations.
// @note    tryFlow is typed for one to six steps.

import { tryFlow, map, type Fallible } from "ts-sumtype";

const inc = map((n: number) => n + 1);

export const out: Fallible<number, number, never> = tryFlow(inc, inc, inc, inc, inc, inc, inc);
