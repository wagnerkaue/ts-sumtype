// @case    allerrors-varargs
// @feature allErrors()
// @kind    mistake
// @title   Results passed as separate arguments
// @intent  Collect the errors from several results; the author passes them varargs-style instead of as one array.

import { allErrors, ok, err } from "ts-sumtype";

export const out = allErrors(ok(1), err("bad"));
