// @case    recursive-payload-unnarrowed
// @feature Sum with a direct self-reference
// @kind    mistake
// @title   Recursive payload read before narrowing
// @intent  Recurse into the wrapped expression without checking the tag first. Measures what a recursive type costs a diagnostic: the whole case set, self-references included, can end up printed.

import { type Sum, type Unit } from "ts-sumtype";

type Expr = Sum<{ atom: Unit; wrap: Expr; twice: Expr }>;
declare const e: Expr;

export const inner = e.wrap;
