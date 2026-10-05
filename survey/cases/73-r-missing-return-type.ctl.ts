// @case    r-missing-return-type
// @feature hand-written early return
// @kind    mistake
// @title   A fallible function with no declared return type
// @intent  Reject an empty input and parse it, leaving the return type to inference.

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
type ParseErr = { kind: "notANumber" };
type ReadErr = { kind: "empty" } | { kind: "parse"; parse: ParseErr };

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? { ok: false, error: { kind: "notANumber" } } : { ok: true, value: Number(raw) };

export function read(raw: string) {
  if (raw === "") return { ok: false, error: { kind: "empty" } } as const;
  const parsed = parse(raw);
  if (!parsed.ok) return { ok: false, error: { kind: "parse", parse: parsed.error } } as const;
  return parsed;
}
