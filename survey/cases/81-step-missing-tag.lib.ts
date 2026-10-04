// @case    step-missing-tag
// @feature step() without a tag
// @kind    mistake
// @title   A fallible function brought into a chain without its tag
// @intent  Parse, then double; the author forgets the tag, so the parse error is not handled.

import { tryFlow, step, err, ok, type Result, type Sum } from "ts-sumtype";

type ParseErr = "not a number";
const parse = (raw: string): Result<number, ParseErr> => (Number.isNaN(Number(raw)) ? err("not a number") : ok(Number(raw)));

export const doubled: (raw: string) => Result<number, Sum<{ parse: ParseErr }>> = tryFlow(
  step(parse),
  step((n) => n * 2),
);
