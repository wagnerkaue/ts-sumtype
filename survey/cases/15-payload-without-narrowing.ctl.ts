// @case    payload-without-narrowing
// @feature hand-rolled discriminated union
// @kind    mistake
// @title   Payload read before narrowing
// @intent  Read the circle radius straight off the union.

type Shape =
  | { kind: "circle"; circle: number }
  | { kind: "square"; square: number }
  | { kind: "rect"; rect: [number, number] };
declare const s: Shape;

export const r = s.circle;
