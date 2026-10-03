// @case    trymatch-extra-arm
// @feature switch with a declared return type
// @kind    mistake
// @title   A handler for a tag that does not exist
// @intent  Handle every case; the author adds a `triangle` case the union never had.

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
      return { ok: true, value: w * h };
    }
    case "triangle":
      return { ok: true, value: 0 };
  }
}
