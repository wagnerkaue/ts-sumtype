// @case    frozen-write
// @feature hand-written readonly type
// @kind    mistake
// @title   Write to a frozen payload
// @intent  Update a field on a frozen payload in place.

type Doc = {
  readonly kind: "page";
  readonly page: { readonly title: string; readonly lines: readonly string[] };
};
declare const d: Doc;

d.page.title = "new";

export {};
