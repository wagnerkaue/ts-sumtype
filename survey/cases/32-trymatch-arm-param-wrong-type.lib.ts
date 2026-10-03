// @case    trymatch-arm-param-wrong-type
// @feature tryMatch()
// @kind    mistake
// @title   A payload annotated with the wrong type
// @intent  Name the circle's payload for documentation; the annotation is wrong.

import { tryMatch, ok, err, type Step, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
type AreaErr = Sum<{ rect: "degenerate" }>;

export const area: Step<Shape, number, AreaErr> = tryMatch({
  circle: (r: string) => ok(r.length),
  square: (side) => ok(side * side),
  rect: ([w, h]) => (w === 0 || h === 0 ? err("degenerate") : ok(w * h)),
});
