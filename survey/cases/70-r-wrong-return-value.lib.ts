// @case    r-wrong-return-value
// @feature r
// @kind    mistake
// @title   A success value of the wrong type
// @intent  Parse the input and return the number; the body returns it as a string.

import { r, errVariant, ok, type Result, type Sum, type Unit } from "ts-sumtype";

type ParseErr = Sum<{ notANumber: Unit }>;
type ReadErr = Sum<{ empty: Unit; parse: ParseErr }>;

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? errVariant("notANumber") : ok(Number(raw));

export const read = (raw: string): Result<number, ReadErr> => r(($) => {
  if (raw === "") return $.fail("empty");
  return String($.try(parse(raw), "parse"));
});
