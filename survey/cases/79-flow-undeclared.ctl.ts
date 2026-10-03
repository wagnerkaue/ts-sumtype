// @case    flow-undeclared
// @feature unannotated parameter
// @kind    mistake
// @title   Chain built without a declared type
// @intent  Join a non-empty list; the author leaves the input untyped.

export const listed = (items) => {
  if (items.length === 0) return { ok: false, error: "empty" } as const;
  return { ok: true, value: items.join(", ") } as const;
};
