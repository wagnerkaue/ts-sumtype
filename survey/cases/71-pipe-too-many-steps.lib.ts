// @case    pipe-too-many-steps
// @feature pipe() overload table
// @kind    mistake
// @title   Nine steps, one past the overload table
// @intent  Chain nine transformations; pipe is typed for eight.
// @note    Overload tables were the prime suspect for verbosity going in. No case in this survey produces `No overload matches this call`; this one reports `Expected 1-9 arguments, but got 10.` The overload machinery is not the problem.

import { pipe } from "ts-sumtype";

const inc = (n: number): number => n + 1;

export const out = pipe(0, inc, inc, inc, inc, inc, inc, inc, inc, inc);
