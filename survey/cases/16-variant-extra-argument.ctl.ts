// @case    variant-extra-argument
// @feature hand-rolled constructor
// @kind    mistake
// @title   A second payload passed to one case
// @intent  Build a case carrying two values; the author passes them as separate arguments rather than one payload.

type Point = { kind: "point"; point: { x: number; y: number } };

declare function point(payload: { x: number; y: number }): Point;

export const c = point(1, 2);
