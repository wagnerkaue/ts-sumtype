// @case    baseline-match
// @feature switch with a declared return type
// @kind    baseline
// @title   Correct exhaustive match
// @intent  Reference point: every case handled, every payload used correctly.

type Shape =
  | { kind: "circle"; circle: number }
  | { kind: "square"; square: number }
  | { kind: "rect"; rect: [number, number] };

export function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.circle * s.circle;
    case "square":
      return s.square * s.square;
    case "rect":
      return s.rect[0] * s.rect[1];
  }
}
