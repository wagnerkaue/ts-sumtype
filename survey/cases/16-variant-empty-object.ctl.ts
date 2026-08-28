// @case    variant-empty-object
// @feature hand-rolled discriminated union
// @kind    mistake
// @title   variant() called with an empty object
// @intent  Build a payload-free case; the author passes `{}` rather than a tagged literal.

type Idle = { kind: "idle"; idle: null };

export const c: Idle = {};
