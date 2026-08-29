// @case    tagged-wrong-depth
// @feature tagged() / errVariant
// @kind    mistake
// @title   Nested case read at the wrong depth
// @intent  Read the parse payload out of an errVariant; the author forgets the "error" layer.

import { errVariant } from "ts-sumtype";

const e = errVariant("parse", { input: "x" });

export const input = e.parse.input;
