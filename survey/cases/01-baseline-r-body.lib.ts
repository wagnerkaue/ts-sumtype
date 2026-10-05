// @case    baseline-r-body
// @feature r
// @kind    baseline
// @title   Correct body with a check and a call that can fail
// @intent  Reference point: reject an empty input, parse it, and double the number.

import { r, errVariant, ok, type Result, type Sum, type Unit } from "ts-sumtype";

type ParseErr = Sum<{ notANumber: Unit }>;
type ReadErr = Sum<{ empty: Unit; parse: ParseErr }>;

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? errVariant("notANumber") : ok(Number(raw));

export const read = (raw: string): Result<number, ReadErr> => r(($) => {
  if (raw === "") return $.fail("empty");
  return $.try(parse(raw), "parse") * 2;
});
