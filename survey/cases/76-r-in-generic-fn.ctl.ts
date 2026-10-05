// @case    r-in-generic-fn
// @feature hand-written early return, generic
// @kind    baseline
// @title   r in a function whose types are unresolved generics
// @intent  Write a reusable helper that measures what any fallible function returns, wrapping its error.

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function measured<T, E>(f: (raw: string) => Result<T, E>, raw: string): Result<number, { kind: "inner"; inner: E }> {
  const result = f(raw);
  if (!result.ok) return { ok: false, error: { kind: "inner", inner: result.error } };
  return { ok: true, value: String(result.value).length };
}
