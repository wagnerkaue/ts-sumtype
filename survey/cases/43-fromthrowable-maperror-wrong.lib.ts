// @case    fromthrowable-maperror-wrong
// @feature fromThrowable()
// @kind    mistake
// @title   mapError produces the wrong error type
// @intent  Catch a throw into a Result<number, string>; the mapper returns an Error.

import { fromThrowable, type Result } from "ts-sumtype";

declare function risky(): number;

export const r: Result<number, string> = fromThrowable(risky, (e) => e as Error);
