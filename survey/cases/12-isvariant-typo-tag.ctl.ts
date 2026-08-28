// @case    isvariant-typo-tag
// @feature discriminant comparison
// @kind    mistake
// @title   Misspelled tag in a guard
// @intent  Test whether a shape is a circle; the tag is misspelled.

type Shape = { kind: "circle"; circle: number } | { kind: "square"; square: number };
declare const s: Shape;

export const isCircle = s.kind === "circel";
