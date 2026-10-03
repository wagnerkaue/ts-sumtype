// @case    tryflow-too-many-steps
// @feature nested calls
// @kind    mistake
// @title   Seven steps, one past the overload table
// @intent  Chain seven transformations.
// @note    Plain TypeScript has no step limit, so this half compiles; the pair is an anomaly by design, recording what the overload table reports.

const inc = (n: number): number => n + 1;

export const out = (n: number): number => inc(inc(inc(inc(inc(inc(inc(n)))))));
