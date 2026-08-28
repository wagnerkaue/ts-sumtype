// @case    recursive-direct-build
// @feature Sum with a direct self-reference
// @kind    baseline
// @title   Building and walking a directly recursive sum
// @intent  A case whose payload IS the recursive type, with no object or array in between -- the shape that historically produced a self-referential type alias error. Regression guard: this must compile clean.

import { type Sum, type Unit, variant, matchTag } from "ts-sumtype";

type Expr = Sum<{ atom: Unit; wrap: Expr; twice: Expr }>;

export const built: Expr = variant({ wrap: variant({ atom: null }) });

export function depth(x: Expr): number {
  return matchTag(x, {
    atom: () => 0,
    wrap: (inner) => 1 + depth(inner),
    twice: (inner) => 2 * depth(inner),
  });
}

export function manual(x: Expr): number {
  if (x.tag === "wrap") return 1 + manual(x.wrap);
  return 0;
}

// mutual recursion, both sides direct
type A = Sum<{ leaf: Unit; toB: B }>;
type B = Sum<{ toA: A }>;
declare const a: A;
export const a1: A = a;
