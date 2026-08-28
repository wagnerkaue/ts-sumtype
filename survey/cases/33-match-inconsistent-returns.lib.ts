// @case    match-inconsistent-returns
// @feature matchTag (exhaustive)
// @kind    mistake
// @title   Arms disagree about the result type
// @intent  Produce a number from every arm; one arm returns a string.

import { matchTag, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
declare const s: Shape;

export const area: number = matchTag(s, {
  circle: (r) => Math.PI * r * r,
  square: (side) => side * side,
  rect: ([w, h]) => `${w}x${h}`,
});
