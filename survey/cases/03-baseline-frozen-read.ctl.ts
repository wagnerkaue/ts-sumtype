// @case    baseline-frozen-read
// @feature hand-written readonly type
// @kind    baseline
// @title   Reading through a Frozen payload
// @intent  Reference point: a deeply immutable payload, read only.

type Doc = {
  readonly kind: "page";
  readonly page: { readonly title: string; readonly lines: readonly string[] };
};
declare const d: Doc;

export const first: string = d.page.lines[0];
export const title: string = d.page.title;
