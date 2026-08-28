// @case    recursive-direct-build
// @feature hand-rolled recursive discriminated union
// @kind    baseline
// @title   Building and walking a directly recursive sum
// @intent  A case whose payload IS the recursive type, with no object or array in between -- the shape that historically produced a self-referential type alias error. Regression guard: this must compile clean.

type Expr =
  | { kind: "atom"; atom: null }
  | { kind: "wrap"; wrap: Expr }
  | { kind: "twice"; twice: Expr };

export const built: Expr = { kind: "wrap", wrap: { kind: "atom", atom: null } };

export function depth(x: Expr): number {
  switch (x.kind) {
    case "atom":
      return 0;
    case "wrap":
      return 1 + depth(x.wrap);
    case "twice":
      return 2 * depth(x.twice);
  }
}

type A = { kind: "leaf"; leaf: null } | { kind: "toB"; toB: B };
type B = { kind: "toA"; toA: A };
declare const a: A;
export const a1: A = a;
