// @case    baseline-pipe-chain
// @feature pipe
// @kind    baseline
// @title   Correct three-step pipe
// @intent  Reference point: parse, validate, format -- each step lines up with the last.

import { pipe, ok, err, type Result } from "ts-sumtype";

const parse = (raw: string): Result<number, string> => {
  const n = Number(raw);
  return Number.isNaN(n) ? err("not a number") : ok(n);
};
const validate = (n: number): Result<number, string> => (n > 0 ? ok(n) : err("not positive"));
const format = (n: number): string => n.toFixed(2);

export const out = pipeResult("41.5", parse, validate, format);
