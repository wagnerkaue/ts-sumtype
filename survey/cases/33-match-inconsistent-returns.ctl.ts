// @case    match-inconsistent-returns
// @feature switch
// @kind    mistake
// @title   Arms disagree about the result type
// @intent  Produce a number from every branch; one branch returns a string.

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
      return `${s.rect[0]}x${s.rect[1]}`;
  }
}
