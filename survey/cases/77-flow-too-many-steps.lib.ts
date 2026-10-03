// @case    flow-too-many-steps
// @feature flow() overload table
// @kind    mistake
// @title   Seven steps, one past the overload table
// @intent  Chain seven transformations.
// @note    flow is typed for one to six steps.

import { flow, map, type Step } from "ts-sumtype";

const inc = map((n: number) => n + 1);

export const out: Step<number, number, never> = flow(inc, inc, inc, inc, inc, inc, inc);
