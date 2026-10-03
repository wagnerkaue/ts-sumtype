// @case    match-wrong-output
// @feature switch with a declared return type
// @kind    mistake
// @title   A handler returns the wrong type
// @intent  Produce a number for every case; one case produces a string.

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
      return `${s.rect[0]}x${s.rect[1]}`;
  }
}
