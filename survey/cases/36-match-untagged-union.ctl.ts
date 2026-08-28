// @case    match-untagged-union
// @feature switch
// @kind    mistake
// @title   matchTag applied to a union discriminated by `kind`
// @intent  Match over an existing union from another codebase that uses `kind`, not `tag`.

type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };
declare const s: Shape;

export function area(): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.radius * s.radius;
    case "square":
      return s.side * s.side;
  }
}
