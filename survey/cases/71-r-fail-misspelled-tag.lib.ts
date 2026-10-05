// @case    r-fail-misspelled-tag
// @feature r
// @kind    mistake
// @title   A failure under a misspelled tag
// @intent  Reject an empty input under the empty case; the tag is misspelled.

import { r, errVariant, ok, type Result, type Sum, type Unit } from "ts-sumtype";

type ParseErr = Sum<{ notANumber: Unit }>;
type ReadErr = Sum<{ empty: Unit; parse: ParseErr }>;

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? errVariant("notANumber") : ok(Number(raw));

export const read = (raw: string): Result<number, ReadErr> => r(($) => {
  if (raw === "") return $.fail("emtpy");
  return $.try(parse(raw), "parse");
});
