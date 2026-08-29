// @case    unwrap-non-sum
// @feature unwrap()
// @kind    mistake
// @title   unwrap() applied to a variant that is not a Result
// @intent  Pull the payload out of a tagged value; unwrap takes a `Result`.
// @note    Two diagnostics, as in the control: the argument is rejected, and the unusable result is reported at its use. The constraint names `Result<unknown, unknown>` and the elaboration picks `ok`, the member actually wanted.

import { unwrap, variant } from "ts-sumtype";

const v = variant({ count: 3 });

export const n = unwrap(v).toFixed(2);
