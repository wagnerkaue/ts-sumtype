// @case    withpayload-wrong-case
// @feature withPayload()
// @kind    mistake
// @title   Replacement payload of the wrong type
// @intent  Swap a shape's payload for a new one; the author supplies a string.

import { withPayload, type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; rect: [number, number] }>;
declare const s: Shape;

export const s2 = withPayload(s, "hello");
