// @case    variant-two-keys
// @feature variant()
// @kind    mistake
// @title   Two keys handed to variant()
// @intent  Build one case carrying two fields; the author writes them side by side instead of nesting them in a payload object.

import { variant } from "ts-sumtype";

export const c = variant({ x: 1, y: 2 });
