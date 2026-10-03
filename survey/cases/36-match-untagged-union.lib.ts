// @case    match-untagged-union
// @feature matchTag()
// @kind    mistake
// @title   matchTag applied to a union discriminated by `kind`
// @intent  Match over an existing union from another codebase that uses `kind`, not `tag`.

import { matchTag, ok, type Step } from "ts-sumtype";

type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

export const area: Step<Shape, number, never> = matchTag({
  circle: (c) => ok(Math.PI * c.radius * c.radius),
  square: (q) => ok(q.side * q.side),
});
