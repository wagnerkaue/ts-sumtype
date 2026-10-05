// @case    r-missing-return-type
// @feature r
// @kind    mistake
// @title   A fallible function with no declared return type
// @intent  Reject an empty input and parse it, leaving the return type to inference.

import { r, errVariant, ok, type Result, type Sum, type Unit } from "ts-sumtype";

type ParseErr = Sum<{ notANumber: Unit }>;
type ReadErr = Sum<{ empty: Unit; parse: ParseErr }>;

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? errVariant("notANumber") : ok(Number(raw));

export const read = (raw: string) => r(($) => {
  if (raw === "") return $.fail("empty");
  return $.try(parse(raw), "parse");
});
