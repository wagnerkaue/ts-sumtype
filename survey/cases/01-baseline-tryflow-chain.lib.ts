// @case    baseline-tryflow-chain
// @feature tryFlow
// @kind    baseline
// @title   Correct three-step chain
// @intent  Reference point: parse, validate, format -- each step lines up with the last.

import { tryFlow, step, ok, err, type Result } from "ts-sumtype";

const parse = (raw: string): Result<number, string> => {
  const n = Number(raw);
  return Number.isNaN(n) ? err("not a number") : ok(n);
};
const validate = (n: number): Result<number, string> => (n > 0 ? ok(n) : err("not positive"));
const format = (n: number): string => n.toFixed(2);

export const run: (raw: string) => Result<string, string> = tryFlow(parse, validate, step(format));
