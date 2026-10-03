// @case    trymatch-missing-arm
// @feature switch with a declared return type
// @kind    mistake
// @title   One tag has no handler
// @intent  Handle every case of a three-case union; the author forgot `square`.

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
    case "rect": {
      const [w, h] = s.rect;
      if (w === 0 || h === 0) return { ok: false, error: { kind: "rect", rect: "degenerate" } };
      return { ok: true, value: w * h };
    }
  }
}
