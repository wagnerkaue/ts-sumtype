// @case    isvariant-typo-tag
// @feature isVariant()
// @kind    mistake
// @title   Misspelled tag in a guard
// @intent  Test whether a shape is a circle; the tag is misspelled.
// @note    One the library wins: it lists the valid tags, where the control's TS2367 `have no overlap` does not. Do not regress this.

import { isVariant, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number }>;
declare const s: Shape;

export const isCircle = isVariant(s, "circel");
