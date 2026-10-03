// @case    baseline-match
// @feature match()
// @kind    baseline
// @title   Correct exhaustive match
// @intent  Reference point: every case handled, every payload used correctly.

import { match, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;

export const area: (shape: Shape) => number = match({
  circle: (r) => Math.PI * r * r,
  square: (side) => side * side,
  rect: ([w, h]) => w * h,
});
