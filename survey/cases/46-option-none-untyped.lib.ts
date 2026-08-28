// @case    option-none-untyped
// @feature none()
// @kind    mistake
// @title   none() with no type argument, reassigned later
// @intent  Start with an empty Option and fill it in; none() infers Option<never>.

import { none, some } from "ts-sumtype";

let o = none();
o = some("hello");

export { o };
