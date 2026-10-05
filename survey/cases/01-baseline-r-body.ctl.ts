// @case    baseline-r-body
// @feature hand-written early return
// @kind    baseline
// @title   Correct body with a check and a call that can fail
// @intent  Reference point: reject an empty input, parse it, and double the number.

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
type ParseErr = { kind: "notANumber" };
type ReadErr = { kind: "empty" } | { kind: "parse"; parse: ParseErr };

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? { ok: false, error: { kind: "notANumber" } } : { ok: true, value: Number(raw) };

export function read(raw: string): Result<number, ReadErr> {
  if (raw === "") return { ok: false, error: { kind: "empty" } };
  const parsed = parse(raw);
  if (!parsed.ok) return { ok: false, error: { kind: "parse", parse: parsed.error } };
  return { ok: true, value: parsed.value * 2 };
}
