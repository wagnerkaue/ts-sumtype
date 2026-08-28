// @case    match-object-value-arm
// @feature matchTag (value arms / NotFn)
// @kind    mistake
// @title   A class instance used as a value arm
// @intent  Return a prebuilt object from each arm instead of calling a function.
// @note    `NotFn` admits `{ [key: string]: unknown }`, which class instances are not assignable to -- a restriction plain TypeScript does not have, since the equivalent lookup table compiles. Reported as a missing index signature, which describes the constraint's implementation rather than the rule.

import { matchTag, type Sum } from "ts-sumtype";

class Renderer {
  constructor(readonly name: string) {}
  draw(): string {
    return this.name;
  }
}

type Shape = Sum<{ circle: number; square: number }>;
declare const s: Shape;

export const renderer = matchTag(s, {
  circle: new Renderer("circle"),
  square: new Renderer("square"),
});
