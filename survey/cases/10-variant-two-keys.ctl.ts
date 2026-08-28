// @case    variant-two-keys
// @feature hand-rolled discriminated union
// @kind    mistake
// @title   Two keys handed to variant()
// @intent  Build one case carrying two fields; the author writes them side by side instead of nesting them in a payload object.

type Point = { kind: "point"; point: { x: number; y: number } };

export const c: Point = { kind: "point", x: 1, y: 2 };
