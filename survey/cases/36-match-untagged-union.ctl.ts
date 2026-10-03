// @case    match-untagged-union
// @feature switch
// @kind    mistake
// @title   matchTag applied to a union discriminated by `kind`
// @intent  Match over an existing union from another codebase that uses `kind`, not `tag`.
// @note    A switch works over any discriminant, so this half compiles; the pair records what matchTag reports.

type Res<T> = { ok: true; value: T };

type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

export function area(s: Shape): Res<number> {
  switch (s.kind) {
    case "circle":
      return { ok: true, value: Math.PI * s.radius * s.radius };
    case "square":
      return { ok: true, value: s.side * s.side };
  }
}
