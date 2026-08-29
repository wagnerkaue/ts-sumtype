// @case    variant-object-as-tag
// @feature hand-rolled discriminated union
// @kind    mistake
// @title   An object passed where the tag goes
// @intent  Build one case carrying two fields; the author packs them into an object and passes that as the whole case.

type Point = { kind: "point"; point: { x: number; y: number } };

export const c: Point = { kind: "point", x: 1, y: 2 };
