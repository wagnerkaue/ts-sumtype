// @case    r-try-error-mismatch
// @feature hand-written early return
// @kind    mistake
// @title   An error wrapped under a case that carries something else
// @intent  Report a parse failure; it goes under the empty case, which carries no payload.

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
type ParseErr = { kind: "notANumber" };
type ReadErr = { kind: "empty" } | { kind: "parse"; parse: ParseErr };

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? { ok: false, error: { kind: "notANumber" } } : { ok: true, value: Number(raw) };

export function read(raw: string): Result<number, ReadErr> {
  const parsed = parse(raw);
  if (!parsed.ok) return { ok: false, error: { kind: "empty", empty: parsed.error } };
  return parsed;
}
