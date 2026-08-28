// @case    match-untagged-union
// @feature matchTag
// @kind    mistake
// @title   matchTag applied to a union discriminated by `kind`
// @intent  Match over an existing union from another codebase that uses `kind`, not `tag`.

import { matchTag } from "ts-sumtype";

type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };
declare const s: Shape;

export const area = matchTag(s, {
  circle: (c) => c,
  square: (q) => q,
});
