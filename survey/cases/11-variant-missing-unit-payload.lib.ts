// @case    variant-missing-unit-payload
// @feature Sum / Unit
// @kind    mistake
// @title   Unit case written without its payload key
// @intent  Write a payload-free case by hand; the author gives only the tag.

import { type Sum, type Unit } from "ts-sumtype";

type Idle = Sum<{ idle: Unit }>;

export const s: Idle = { tag: "idle" };
