// @case    variant-empty-object
// @feature variant()
// @kind    mistake
// @title   variant() called with an empty object
// @intent  Build a payload-free case; the author passes `{}` rather than a key mapped to unit.

import { variant } from "ts-sumtype";

export const c = variant({});
