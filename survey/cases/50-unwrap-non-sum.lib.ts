// @case    unwrap-non-sum
// @feature unwrap()
// @kind    mistake
// @title   unwrap() applied to a variant that is not Ok or Some
// @intent  Pull the payload out of a tagged value; unwrap only knows `ok` and `some`.
// @note    `ValueOf<R>` resolves to `never` for anything that is not `ok`/`some`, so the call is accepted and the error surfaces at the *use* site without ever naming `unwrap`. The shortest library message in the survey and the least useful: size is the wrong metric here.

import { unwrap, variant } from "ts-sumtype";

const v = variant({ count: 3 });

export const n = unwrap(v).toFixed(2);
