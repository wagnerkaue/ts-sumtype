// @case    fromflat-missing-key
// @feature fromFlat()
// @kind    mistake
// @title   Converter keyed on a field the data does not have
// @intent  Convert a flat union to a Sum; the data is discriminated by `type`, the converter was built for `kind`.

import { fromFlat } from "ts-sumtype";

const toSum = fromFlat("kind");

export const s = toSum({ type: "circle", radius: 1 });
