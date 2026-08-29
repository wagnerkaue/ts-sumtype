// @case    variant-extra-argument
// @feature variant()
// @kind    mistake
// @title   A second payload passed to one case
// @intent  Build a case carrying two values; the author passes them as separate arguments rather than one payload.

import { variant } from "ts-sumtype";

export const c = variant("point", 1, 2);
