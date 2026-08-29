// @case    variant-object-as-tag
// @feature variant()
// @kind    mistake
// @title   An object passed where the tag goes
// @intent  Build one case carrying two fields; the author packs them into an object and passes that as the whole case.

import { variant } from "ts-sumtype";

export const c = variant({ x: 1, y: 2 });
