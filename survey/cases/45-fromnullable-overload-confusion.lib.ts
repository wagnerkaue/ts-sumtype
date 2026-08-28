// @case    fromnullable-overload-confusion
// @feature fromNullable() overloads
// @kind    mistake
// @title   One-argument form used where a Result was wanted
// @intent  Turn a nullable into a Result; the author omits the error argument and gets an Option.

import { fromNullable, type Result } from "ts-sumtype";

declare const name: string | null;

export const r: Result<string, string> = fromNullable(name);
