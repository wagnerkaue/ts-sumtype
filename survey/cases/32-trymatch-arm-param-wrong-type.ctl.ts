// @case    trymatch-arm-param-wrong-type
// @feature switch with a declared return type
// @kind    mistake
// @title   A payload annotated with the wrong type
// @intent  Name the circle's payload for documentation; the annotation is wrong.

type Res<T, E> = { ok: true; value: T } | { ok: false; error: E };

type Shape =
  | { kind: "circle"; circle: number }
  | { kind: "square"; square: number }
  | { kind: "rect"; rect: [number, number] };
type AreaErr = { kind: "rect"; rect: "degenerate" };

export function area(s: Shape): Res<number, AreaErr> {
  switch (s.kind) {
    case "circle": {
      const r: string = s.circle;
      return { ok: true, value: r.length };
    }
    case "square":
      return { ok: true, value: s.square * s.square };
    case "rect": {
      const [w, h] = s.rect;
      if (w === 0 || h === 0) return { ok: false, error: { kind: "rect", rect: "degenerate" } };
      return { ok: true, value: w * h };
    }
  }
}
