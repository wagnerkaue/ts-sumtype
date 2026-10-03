// @case    flow-for-tryflow
// @feature flow() given steps
// @kind    mistake
// @title   Steps composed with flow instead of tryFlow
// @intent  Reject a negative number, then add one; the second step receives the first step's whole Result.

import { flow, map, rejectIf, type Result, type Sum, type Unit } from "ts-sumtype";

type NegativeErr = Sum<{ negative: Unit }>;

export const run: (n: number) => Result<number, NegativeErr> = flow(
  rejectIf((n) => n < 0, "negative"),
  map((n) => n + 1),
);
