// @case    fromenum-widened-string
// @feature string literal union
// @kind    mistake
// @title   fromEnum given a widened string
// @intent  Turn a status string from the network into a Status union; the input is typed `string`.

type Status = "idle" | "busy";

declare const raw: string;

export const st: Status = raw;
