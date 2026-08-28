// @case    allresults-destructured
// @feature allResults()
// @kind    mistake
// @title   The returned Result destructured as a tuple
// @intent  Collect two results into a pair; the author destructures the return value directly.

import { allResults, ok, type Result } from "ts-sumtype";

declare const a: Result<number, string>;
declare const b: Result<string, string>;

const [x, y] = allResults([a, b]);

export { x, y };
