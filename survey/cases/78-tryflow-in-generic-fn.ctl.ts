// @case    tryflow-in-generic-fn
// @feature hand-written early-return chain, generic
// @kind    baseline
// @title   tryFlow called on steps whose types are unresolved generics
// @intent  Write a reusable helper that extends whatever step it is handed.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

export function measured<T>(f: (raw: string) => Res<T>): (raw: string) => Res<number> {
  return (raw) => {
    const r = f(raw);
    if (!r.ok) return r;
    return { ok: true, value: String(r.value).length };
  };
}
