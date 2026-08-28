// @case    match-fallback-narrow-param
// @feature matchTag (fallback)
// @kind    mistake
// @title   Fallback annotated for only one of the remaining cases
// @intent  Handle `circle` explicitly and everything else in a fallback; the author assumes only `square` is left.

import { matchTag, type Sum, type ExtractVariant } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
declare const s: Shape;

export const area = matchTag(
  s,
  { circle: (r) => Math.PI * r * r },
  (rest: ExtractVariant<Shape, "square">) => rest.square * rest.square,
);
