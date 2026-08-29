// @case    frozen-array-to-mutable-param
// @feature Frozen
// @kind    mistake
// @title   Frozen array passed to a mutable-array parameter
// @intent  Hand a frozen payload to an existing helper typed `string[]`.
// @note    Longer than the control and vaguer: TypeScript's readonly-array diagnostic fires only for `ReadonlyArray` itself, so `FrozenArray`, an interface extending it, falls through to the generic structural path and lists mutators instead of saying `readonly`. Inlining `readonly Frozen<T[number]>[]` recovers that wording and matches the control exactly, at the cost of every array message on a recursive frozen type: `FrozenArray<Term>` becomes 498 characters of expanded union, since the interface is what gives the cycle a name to stop at.

import { type Frozen, type Sum } from "ts-sumtype";

type Doc = Frozen<Sum<{ page: { lines: string[] } }>>;
declare const d: Doc;
declare function render(lines: string[]): string;

export const out = render(d.page.lines);
