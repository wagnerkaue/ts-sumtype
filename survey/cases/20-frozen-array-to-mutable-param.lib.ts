// @case    frozen-array-to-mutable-param
// @feature Frozen
// @kind    mistake
// @title   Frozen array passed to a mutable-array parameter
// @intent  Hand a frozen payload to an existing helper typed `string[]`.

import { type Frozen, type Sum } from "ts-sumtype";

type Doc = Frozen<Sum<{ page: { lines: string[] } }>>;
declare const d: Doc;
declare function render(lines: string[]): string;

export const out = render(d.page.lines);
