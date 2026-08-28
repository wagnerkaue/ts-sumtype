// @case    pipe-too-many-steps
// @feature nested calls
// @kind    mistake
// @title   Nine steps, one past the overload table
// @intent  Chain nine transformations, written out by hand.

const inc = (n: number): number => n + 1;

export const out = inc(inc(inc(inc(inc(inc(inc(inc(inc(0)))))))));
