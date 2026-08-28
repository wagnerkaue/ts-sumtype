// @case    result-err-into-infallible
// @feature Result<T, never>
// @kind    mistake
// @title   Returning an error from a function declared infallible
// @intent  The signature says the function cannot fail; the body returns an error anyway.

import { err, ok, type Result } from "ts-sumtype";

export function parse(raw: string): Result<number, never> {
  const n = Number(raw);
  if (Number.isNaN(n)) return err("not a number");
  return ok(n);
}
