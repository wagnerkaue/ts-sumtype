// @case    pipe-in-generic-fn
// @feature hand-written early-return chain, generic
// @kind    baseline
// @title   pipeResult called on an unresolved generic
// @intent  Write a reusable helper that pipes whatever Result it is handed.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

export function describe<T>(r: Res<T>): Res<number> {
  if (!r.ok) return r;
  return { ok: true, value: String(r.value).length };
}
