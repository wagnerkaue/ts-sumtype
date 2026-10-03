// @case    match-wrong-output
// @feature match()
// @kind    mistake
// @title   A handler returns the wrong type
// @intent  Produce a number for every case; one case produces a string.

import { match, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;

export const area: (shape: Shape) => number = match({
  circle: (r) => Math.PI * r * r,
  square: (side) => side * side,
  rect: ([w, h]) => `${w}x${h}`,
});
