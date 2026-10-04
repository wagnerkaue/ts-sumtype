// @case    trymatch-untagged-union
// @feature tryMatch()
// @kind    mistake
// @title   tryMatch applied to a union discriminated by `kind`
// @intent  Match over an existing union from another codebase that uses `kind`, not `tag`.

import { tryMatch, ok, type Fallible } from "ts-sumtype";

type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

export const area: Fallible<Shape, number, never> = tryMatch({
  circle: (c) => ok(Math.PI * c.radius * c.radius),
  square: (q) => ok(q.side * q.side),
});
