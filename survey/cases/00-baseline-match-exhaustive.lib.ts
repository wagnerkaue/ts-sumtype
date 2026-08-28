// @case    baseline-match-exhaustive
// @feature matchTag (exhaustive)
// @kind    baseline
// @title   Correct exhaustive match
// @intent  Reference point: every arm present, every payload used correctly.

import { matchTag, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
declare const s: Shape;

export const area: number = matchTag(s, {
  circle: (r) => Math.PI * r * r,
  square: (side) => side * side,
  rect: ([w, h]) => w * h,
});
