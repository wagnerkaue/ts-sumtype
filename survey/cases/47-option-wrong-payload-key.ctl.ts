// @case    option-wrong-payload-key
// @feature hand-rolled Option
// @kind    mistake
// @title   Payload read under the wrong key after narrowing
// @intent  Read the value out of a Some; the author reaches for `.value`.

type Opt<T> = { kind: "some"; some: T } | { kind: "none" };

declare const o: Opt<string>;

export function read(): string {
  if (o.kind === "some") return o.value;
  return "";
}
