// @case    step-missing-tag
// @feature hand-written chain
// @kind    mistake
// @title   A fallible function brought into a chain without its tag
// @intent  Parse, then double; the author forgets the tag, so the parse error is not handled.

type Res<T, E> = { ok: true; value: T } | { ok: false; error: E };
type ParseErr = "not a number";
const parse = (raw: string): Res<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? { ok: false, error: "not a number" } : { ok: true, value: Number(raw) };

export function doubled(raw: string): Res<number, { parse: ParseErr }> {
  const n = parse(raw);
  return { ok: true, value: n * 2 };
}
