// @case    r-try-error-mismatch
// @feature r
// @kind    mistake
// @title   An error wrapped under a case that carries something else
// @intent  Report a parse failure; it goes under the empty case, which carries no payload.

import { r, errVariant, ok, type Result, type Sum, type Unit } from "ts-sumtype";

type ParseErr = Sum<{ notANumber: Unit }>;
type ReadErr = Sum<{ empty: Unit; parse: ParseErr }>;

const parse = (raw: string): Result<number, ParseErr> =>
  Number.isNaN(Number(raw)) ? errVariant("notANumber") : ok(Number(raw));

export const read = (raw: string): Result<number, ReadErr> => r(($) => {
  return $.try(parse(raw), "empty");
});
