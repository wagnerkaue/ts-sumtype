// @case    fromflat-missing-key
// @feature hand-written converter
// @kind    mistake
// @title   Converter keyed on a field the data does not have
// @intent  Convert a flat union to a nested one; the data is discriminated by `type`, the converter was built for `kind`.

declare function toSum<T extends { kind: string }>(value: T): { tag: T["kind"] };

export const s = toSum({ type: "circle", radius: 1 });
