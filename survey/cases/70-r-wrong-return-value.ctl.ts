// @case    r-wrong-return-value
// @feature hand-written early return
// @kind    mistake
// @title   A success value of the wrong type
// @intent  Parse the input and return the number; the body returns it as a string.

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
type ParseErr = { kind: "notANumber" };
type ReadErr = { kind: "empty" } | { kind: "parse"; parse: ParseErr };

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? { ok: false, error: { kind: "notANumber" } } : { ok: true, value: Number(raw) };

export function read(raw: string): Result<number, ReadErr> {
  if (raw === "") return { ok: false, error: { kind: "empty" } };
  const parsed = parse(raw);
  if (!parsed.ok) return { ok: false, error: { kind: "parse", parse: parsed.error } };
  return { ok: true, value: String(parsed.value) };
}
