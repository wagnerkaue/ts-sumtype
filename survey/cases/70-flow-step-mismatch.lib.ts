// @case    flow-step-mismatch
// @feature flow()
// @kind    mistake
// @title   A function's input does not match the previous function's output
// @intent  Parse, then round; the author forgets the middle function turned the number into a string.

import { flow } from "ts-sumtype";

const parse = (raw: string): number => Number(raw);
const show = (n: number): string => n.toFixed(2);
const round = (n: number): number => Math.round(n);

export const run: (raw: string) => number = flow(parse, show, round);
