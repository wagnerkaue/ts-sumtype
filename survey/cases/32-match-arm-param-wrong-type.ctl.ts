// @case    match-arm-param-wrong-type
// @feature switch
// @kind    mistake
// @title   Arm parameter annotated with the wrong payload type
// @intent  Bind the payload to a named local for documentation; the annotation is wrong.

type Shape = { kind: "circle"; circle: number } | { kind: "square"; square: number };
declare const s: Shape;

export function label(): number {
  switch (s.kind) {
    case "circle": {
      const r: string = s.circle;
      return r.length;
    }
    case "square":
      return s.square * s.square;
  }
}
