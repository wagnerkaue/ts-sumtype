// @case    option-wrong-payload-key
// @feature Option payload key
// @kind    mistake
// @title   Payload read under the wrong key after narrowing
// @intent  Read the value out of a Some; the author reaches for `.value`.

import { isSome, type Option } from "ts-sumtype";

declare const o: Option<string>;

export function read(): string {
  if (isSome(o)) return o.value;
  return "";
}
