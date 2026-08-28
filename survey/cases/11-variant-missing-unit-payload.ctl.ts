// @case    variant-missing-unit-payload
// @feature hand-rolled discriminated union
// @kind    mistake
// @title   Unit case written without its payload key
// @intent  Write a payload-free case by hand; the author gives only the tag.

type Idle = { kind: "idle"; idle: null };

export const s: Idle = { kind: "idle" };
