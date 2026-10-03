// @case    baseline-match-exhaustive
// @feature matchTag()
// @kind    baseline
// @title   Correct exhaustive match
// @intent  Reference point: every case handled, every payload used correctly.

import { matchTag, ok, err, type Step, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
type AreaErr = Sum<{ rect: "degenerate" }>;

export const area: Step<Shape, number, AreaErr> = matchTag({
  circle: (r) => ok(Math.PI * r * r),
  square: (side) => ok(side * side),
  rect: ([w, h]) => (w === 0 || h === 0 ? err("degenerate") : ok(w * h)),
});
