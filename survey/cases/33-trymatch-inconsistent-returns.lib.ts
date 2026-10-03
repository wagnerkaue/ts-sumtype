// @case    trymatch-inconsistent-returns
// @feature tryMatch()
// @kind    mistake
// @title   Handlers disagree about the result type
// @intent  Produce a number for every case; one case produces a string.

import { tryMatch, ok, err, type Step, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
type AreaErr = Sum<{ rect: "degenerate" }>;

export const area: Step<Shape, number, AreaErr> = tryMatch({
  circle: (r) => ok(Math.PI * r * r),
  square: (side) => ok(side * side),
  rect: ([w, h]) => (w === 0 || h === 0 ? err("degenerate") : ok(`${w}x${h}`)),
});
