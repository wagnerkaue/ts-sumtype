// @case    match-missing-arm
// @feature matchTag()
// @kind    mistake
// @title   One tag has no handler
// @intent  Handle every case of a three-case union; the author forgot `square`.

import { matchTag, ok, err, type Step, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
type AreaErr = Sum<{ rect: "degenerate" }>;

export const area: Step<Shape, number, AreaErr> = matchTag({
  circle: (r) => ok(Math.PI * r * r),
  rect: ([w, h]) => (w === 0 || h === 0 ? err("degenerate") : ok(w * h)),
});
