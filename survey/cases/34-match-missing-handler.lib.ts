// @case    match-missing-handler
// @feature match()
// @kind    mistake
// @title   One tag has no handler
// @intent  Handle every case of a three-case union; the author forgot `square`.

import { match, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;

export const area: (shape: Shape) => number = match({
  circle: (r) => Math.PI * r * r,
  rect: ([w, h]) => w * h,
});
