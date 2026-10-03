// @case    trymatch-extra-arm
// @feature tryMatch()
// @kind    mistake
// @title   A handler for a tag that does not exist
// @intent  Handle every case; the author adds a `triangle` case the union never had.

import { tryMatch, ok, err, type Step, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
type AreaErr = Sum<{ rect: "degenerate" }>;

export const area: Step<Shape, number, AreaErr> = tryMatch({
  circle: (r) => ok(Math.PI * r * r),
  square: (side) => ok(side * side),
  rect: ([w, h]) => (w === 0 || h === 0 ? err("degenerate") : ok(w * h)),
  triangle: () => ok(0),
});
