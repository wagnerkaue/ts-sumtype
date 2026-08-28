// @case    match-object-value-arm
// @feature Record lookup table
// @kind    mistake
// @title   A class instance used as a value arm
// @intent  Return a prebuilt object from each branch instead of calling a function.

class Renderer {
  constructor(readonly name: string) {}
  draw(): string {
    return this.name;
  }
}

type Shape = { kind: "circle"; circle: number } | { kind: "square"; square: number };
declare const s: Shape;

const table: Record<Shape["kind"], Renderer> = {
  circle: new Renderer("circle"),
  square: new Renderer("square"),
};

export const renderer = table[s.kind];
