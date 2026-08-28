// @case    recursive-payload-unnarrowed
// @feature hand-rolled recursive discriminated union
// @kind    mistake
// @title   Recursive payload read before narrowing
// @intent  Recurse into the wrapped expression without checking the tag first. Measures what a recursive type costs a diagnostic: the whole case set, self-references included, can end up printed.

type Expr =
  | { kind: "atom"; atom: null }
  | { kind: "wrap"; wrap: Expr }
  | { kind: "twice"; twice: Expr };
declare const e: Expr;

export const inner = e.wrap;
