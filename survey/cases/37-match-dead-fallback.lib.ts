// @case    match-dead-fallback
// @feature matchTag (fallback)
// @kind    baseline
// @title   Defensive fallback on an already-exhaustive match
// @intent  Add a defensive fallback to an already-exhaustive match; the fallback can never run.

import { matchTag, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number }>;
declare const s: Shape;

export const area = matchTag(
  s,
  { circle: (r) => Math.PI * r * r, square: (side) => side * side },
  () => 0,
);
