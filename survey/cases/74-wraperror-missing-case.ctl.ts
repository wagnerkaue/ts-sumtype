// @case    wraperror-missing-case
// @feature hand-rolled error wrapping
// @kind    mistake
// @title   A wrapped error the declared error type has no case for
// @intent  Report a parse failure under its own tag; the declared error type was never given that case.

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const parse = (raw: string): Result<number, "not a number"> =>
  Number.isNaN(Number(raw)) ? { ok: false, error: "not a number" } : { ok: true, value: Number(raw) };

type ReadErr = { kind: "empty" };

export function read(raw: string): Result<number, ReadErr> {
  const parsed = parse(raw);
  if (!parsed.ok) return { ok: false, error: { kind: "parse", parse: parsed.error } };
  return parsed;
}
