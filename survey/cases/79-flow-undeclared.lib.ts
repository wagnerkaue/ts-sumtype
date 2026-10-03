// @case    flow-undeclared
// @feature flow() without a declared type
// @kind    mistake
// @title   Chain built without a declared type
// @intent  Join a non-empty list; the author leaves the input untyped.
// @note    Nothing gives the steps their input type: it comes from the declared type of the constant holding the chain.

import { flow, map, rejectIf } from "ts-sumtype";

export const listed = flow(
  rejectIf((items) => items.length === 0, "empty"),
  map((items) => items.join(", ")),
);
