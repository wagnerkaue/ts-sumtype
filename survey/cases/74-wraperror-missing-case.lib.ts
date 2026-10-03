// @case    wraperror-missing-case
// @feature wrapError()
// @kind    mistake
// @title   A wrapped error the declared error type has no case for
// @intent  Report a parse failure under its own tag; the declared error type was never given that case.

import { err, ok, wrapError, type Result, type Sum, type Unit } from "ts-sumtype";

const parse = (raw: string): Result<number, "not a number"> =>
  Number.isNaN(Number(raw)) ? err("not a number") : ok(Number(raw));

type ReadErr = Sum<{ empty: Unit }>;

export function read(raw: string): Result<number, ReadErr> {
  return wrapError(parse(raw), "parse");
}
