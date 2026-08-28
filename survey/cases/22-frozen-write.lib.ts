// @case    frozen-write
// @feature Frozen
// @kind    mistake
// @title   Write to a frozen payload
// @intent  Update a field on a frozen payload in place.

import { type Frozen, type Sum } from "ts-sumtype";

type Doc = Frozen<Sum<{ page: { title: string; lines: string[] } }>>;
declare const d: Doc;

d.page.title = "new";

export {};
