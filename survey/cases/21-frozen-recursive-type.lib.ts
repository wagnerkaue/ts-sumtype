// @case    frozen-recursive-type
// @feature Frozen over a recursive type
// @kind    mistake
// @title   Frozen applied to an externally declared recursive type
// @intent  Walk a frozen JSON tree recursively; Frozen<Json> is not a fixed point, so the elements come back mutable.

import { type Frozen } from "ts-sumtype";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export function size(v: Frozen<Json>): number {
  if (Array.isArray(v)) return v.reduce((n, e) => n + size(e), 0);
  if (typeof v === "object" && v !== null) return Object.values(v).reduce((n, e) => n + size(e), 0);
  return 1;
}
