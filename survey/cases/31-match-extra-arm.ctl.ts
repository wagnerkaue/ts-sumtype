// @case    match-extra-arm
// @feature switch
// @kind    mistake
// @title   An arm for a tag that does not exist
// @intent  Handle every case; the author adds a `triangle` branch the union never had.

type Shape = { kind: "circle"; circle: number } | { kind: "square"; square: number };
declare const s: Shape;

export function area(): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.circle * s.circle;
    case "square":
      return s.square * s.square;
    case "triangle":
      return 0;
  }
}
