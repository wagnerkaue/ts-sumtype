// @case    match-dead-fallback
// @feature switch with default
// @kind    baseline
// @title   Defensive fallback on an already-exhaustive match
// @intent  Add a defensive default to an already-exhaustive switch; the default can never run.

type Shape = { kind: "circle"; circle: number } | { kind: "square"; square: number };
declare const s: Shape;

export function area(): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.circle * s.circle;
    case "square":
      return s.square * s.square;
    default: {
      const _dead: never = s;
      return 0;
    }
  }
}
