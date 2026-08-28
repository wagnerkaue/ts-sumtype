// @case    match-missing-arm
// @feature matchTag (exhaustive)
// @kind    mistake
// @title   One tag has no arm
// @intent  Handle every case of a three-case union; the author forgot `square`.

import { matchTag, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
declare const s: Shape;

export const area = matchTag(s, {
  circle: (r) => Math.PI * r * r,
  rect: ([w, h]) => w * h,
});
