// @case    trymatch-inconsistent-returns
// @feature switch with a declared return type
// @kind    mistake
// @title   Handlers disagree about the result type
// @intent  Produce a number for every case; one case produces a string.

type Res<T, E> = { ok: true; value: T } | { ok: false; error: E };

type Shape =
  | { kind: "circle"; circle: number }
  | { kind: "square"; square: number }
  | { kind: "rect"; rect: [number, number] };
type AreaErr = { kind: "rect"; rect: "degenerate" };

export function area(s: Shape): Res<number, AreaErr> {
  switch (s.kind) {
    case "circle":
      return { ok: true, value: Math.PI * s.circle * s.circle };
    case "square":
      return { ok: true, value: s.square * s.square };
    case "rect": {
      const [w, h] = s.rect;
      if (w === 0 || h === 0) return { ok: false, error: { kind: "rect", rect: "degenerate" } };
      return { ok: true, value: `${w}x${h}` };
    }
  }
}
