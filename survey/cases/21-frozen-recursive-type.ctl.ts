// @case    frozen-recursive-type
// @feature hand-written DeepReadonly over a recursive type
// @kind    mistake
// @title   Frozen applied to an externally declared recursive type
// @intent  Walk a frozen JSON tree recursively; DeepReadonly<Json> is not a fixed point, so the elements come back mutable.

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type DeepReadonly<T> = T extends (infer E)[]
  ? readonly DeepReadonly<E>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export function size(v: DeepReadonly<Json>): number {
  if (Array.isArray(v)) return v.reduce((n, e) => n + size(e), 0);
  if (typeof v === "object" && v !== null) return Object.values(v).reduce((n, e) => n + size(e), 0);
  return 1;
}
