// @case    result-err-into-infallible
// @feature hand-rolled infallible Result
// @kind    mistake
// @title   Returning an error from a function declared infallible
// @intent  The signature says the function cannot fail; the body returns an error anyway.

type Ok<T> = { ok: true; value: T };

export function parse(raw: string): Ok<number> {
  const n = Number(raw);
  if (Number.isNaN(n)) return { ok: false, error: "not a number" };
  return { ok: true, value: n };
}
