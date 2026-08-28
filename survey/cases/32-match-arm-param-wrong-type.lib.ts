// @case    match-arm-param-wrong-type
// @feature matchTag (exhaustive)
// @kind    mistake
// @title   Arm parameter annotated with the wrong payload type
// @intent  Annotate the arm parameter for documentation; the annotation is wrong.

import { matchTag, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number }>;
declare const s: Shape;

export const label = matchTag(s, {
  circle: (r: string) => r.length,
  square: (side) => side * side,
});
