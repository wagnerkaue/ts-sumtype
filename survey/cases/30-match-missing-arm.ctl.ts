// @case    match-missing-arm
// @feature switch + never exhaustiveness check
// @kind    mistake
// @title   One tag has no arm
// @intent  Handle every case of a three-case union; the author forgot `square`.

type Shape =
  | { kind: "circle"; circle: number }
  | { kind: "square"; square: number }
  | { kind: "rect"; rect: [number, number] };
declare const s: Shape;

export function area(): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.circle * s.circle;
    case "rect":
      return s.rect[0] * s.rect[1];
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}
