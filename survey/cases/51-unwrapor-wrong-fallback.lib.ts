// @case    unwrapor-wrong-fallback
// @feature unwrapOr()
// @kind    mistake
// @title   Fallback of the wrong type
// @intent  Default a numeric Result to a placeholder; the placeholder is a string.

import { unwrapOr, type Result } from "ts-sumtype";

declare const r: Result<number, string>;

export const n = unwrapOr(r, "zero");
