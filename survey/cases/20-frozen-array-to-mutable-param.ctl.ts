// @case    frozen-array-to-mutable-param
// @feature readonly array
// @kind    mistake
// @title   Frozen array passed to a mutable-array parameter
// @intent  Hand a frozen payload to an existing helper typed `string[]`.

type Doc = { readonly kind: "page"; readonly page: { readonly lines: readonly string[] } };
declare const d: Doc;
declare function render(lines: string[]): string;

export const out = render(d.page.lines);
