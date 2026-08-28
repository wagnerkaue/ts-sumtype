// @case    fromenum-widened-string
// @feature fromEnum()
// @kind    mistake
// @title   fromEnum given a widened string
// @intent  Turn a status string from the network into a Status sum; the input is typed `string`.

import { fromEnum, type Sum, type Unit } from "ts-sumtype";

type Status = Sum<{ idle: Unit; busy: Unit }>;

declare const raw: string;

export const st: Status = fromEnum(raw);
