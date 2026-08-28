// @case    match-fallback-narrow-param
// @feature switch with default
// @kind    mistake
// @title   Fallback annotated for only one of the remaining cases
// @intent  Handle `circle` explicitly and everything else in a default; the author assumes only `square` is left.

type Shape =
  | { kind: "circle"; circle: number }
  | { kind: "square"; square: number }
  | { kind: "rect"; rect: [number, number] };
declare const s: Shape;

export function area(): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.circle * s.circle;
    default: {
      const rest: { kind: "square"; square: number } = s;
      return rest.square * rest.square;
    }
  }
}
