// @case    match-missing-handler
// @feature switch with a declared return type
// @kind    mistake
// @title   One tag has no handler
// @intent  Handle every case of a three-case union; the author forgot `square`.

type Shape =
  | { kind: "circle"; circle: number }
  | { kind: "square"; square: number }
  | { kind: "rect"; rect: [number, number] };

export function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.circle * s.circle;
    case "rect":
      return s.rect[0] * s.rect[1];
  }
}
