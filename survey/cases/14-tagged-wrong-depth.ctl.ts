// @case    tagged-wrong-depth
// @feature nested object literal
// @kind    mistake
// @title   Nested case read at the wrong depth
// @intent  Read the parse payload out of a nested error value; the author forgets the "error" layer.

const e = { kind: "error", error: { kind: "parse", parse: { input: "x" } } } as const;

export const input = e.parse.input;
