// @case    baseline-match-exhaustive
// @feature switch + never exhaustiveness check
// @kind    baseline
// @title   Correct exhaustive match
// @intent  Reference point: every arm present, every payload used correctly.

type Shape =
  | { kind: "circle"; circle: number }
  | { kind: "square"; square: number }
  | { kind: "rect"; rect: [number, number] };
declare const s: Shape;

export function area(): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.circle * s.circle;
    case "square":
      return s.square * s.square;
    case "rect":
      return s.rect[0] * s.rect[1];
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}
