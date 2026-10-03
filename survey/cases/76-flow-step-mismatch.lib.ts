// @case    flow-step-mismatch
// @feature flow()
// @kind    mistake
// @title   A step's input does not match the previous step's output
// @intent  Parse, then round; the author forgets the middle step turned the number into a string.

import { flow, map, ok, err, type Result } from "ts-sumtype";

const parse = (raw: string): Result<number, string> =>
  Number.isNaN(Number(raw)) ? err("not a number") : ok(Number(raw));
const show = (n: number): string => n.toFixed(2);
const round = (n: number): number => Math.round(n);

export const run: (raw: string) => Result<number, string> = flow(parse, map(show), map(round));
