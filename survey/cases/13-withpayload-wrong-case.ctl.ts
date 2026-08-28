// @case    withpayload-wrong-case
// @feature object literal rebuild
// @kind    mistake
// @title   Replacement payload of the wrong type
// @intent  Swap a shape's payload for a new one; the author supplies a string.

type Shape = { kind: "circle"; circle: number } | { kind: "rect"; rect: [number, number] };

export const s2: Shape = { kind: "circle", circle: "hello" };
