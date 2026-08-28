// @case    baseline-frozen-read
// @feature Frozen
// @kind    baseline
// @title   Reading through a Frozen payload
// @intent  Reference point: a deeply immutable payload, read only.

import { type Frozen, type Sum } from "ts-sumtype";

type Doc = Frozen<Sum<{ page: { title: string; lines: string[] } }>>;
declare const d: Doc;

export const first: string = d.page.lines[0];
export const title: string = d.page.title;
