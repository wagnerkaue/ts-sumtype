// @case    r-fail-misspelled-tag
// @feature hand-written early return
// @kind    mistake
// @title   A failure under a misspelled tag
// @intent  Reject an empty input under the empty case; the tag is misspelled.

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
type ParseErr = { kind: "notANumber" };
type ReadErr = { kind: "empty" } | { kind: "parse"; parse: ParseErr };

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? { ok: false, error: { kind: "notANumber" } } : { ok: true, value: Number(raw) };

export function read(raw: string): Result<number, ReadErr> {
  if (raw === "") return { ok: false, error: { kind: "emtpy" } };
  const parsed = parse(raw);
  if (!parsed.ok) return { ok: false, error: { kind: "parse", parse: parsed.error } };
  return parsed;
}
