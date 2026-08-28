// @case    fromkeyed-swapped-keys
// @feature fromKeyed()
// @kind    mistake
// @title   Converter built for the wrong key names
// @intent  Rekey data stored as `tag`/`payload`; the converter was built for `type`/`data`.

import { fromKeyed } from "ts-sumtype";

const toSum = fromKeyed("type", "data");

export const s = toSum({ tag: "circle", payload: 1 });
