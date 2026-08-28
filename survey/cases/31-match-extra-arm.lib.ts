// @case    match-extra-arm
// @feature matchTag (exhaustive)
// @kind    mistake
// @title   An arm for a tag that does not exist
// @intent  Handle every case; the author adds a `triangle` arm the union never had.
// @note    Accepted silently: `C` in `matchTag<V, C extends CasesMixed<V>>` is inferred *from* the arms object, so the literal is never excess-property-checked against `CasesMixed<V>`. Plain TypeScript catches the same slip with TS2678.

import { matchTag, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number }>;
declare const s: Shape;

export const area = matchTag(s, {
  circle: (r) => Math.PI * r * r,
  square: (side) => side * side,
  triangle: (b: number) => b / 2,
});
