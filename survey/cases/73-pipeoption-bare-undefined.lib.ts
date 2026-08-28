// @case    pipeoption-bare-undefined
// @feature pipeOption()
// @kind    mistake
// @title   A step returns undefined instead of none()
// @intent  Drop non-positive numbers from the pipe; the author returns undefined rather than none().

import { pipeOption, some } from "ts-sumtype";

export const out = pipeOption(
  some(3),
  (n: number) => (n > 0 ? n : undefined),
  (n: number) => n.toFixed(2),
);
