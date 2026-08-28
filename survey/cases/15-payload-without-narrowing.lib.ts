// @case    payload-without-narrowing
// @feature Sum member access
// @kind    mistake
// @title   Payload read before narrowing
// @intent  Read the circle radius straight off the union.

import { type Sum } from "ts-sumtype";

type Shape = Sum<{ circle: number; square: number; rect: [number, number] }>;
declare const s: Shape;

export const r = s.circle;
