// @case    result-read-without-narrowing
// @feature Result
// @kind    mistake
// @title   Payload read straight off a Result
// @intent  Use the success value without checking for the error case first.

import { type Result } from "ts-sumtype";

declare const r: Result<number, string>;

export const n = r.ok;
