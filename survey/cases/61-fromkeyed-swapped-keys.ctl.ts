// @case    fromkeyed-swapped-keys
// @feature hand-written converter
// @kind    mistake
// @title   Converter built for the wrong key names
// @intent  Rekey data stored as `tag`/`payload`; the converter was built for `type`/`data`.

declare function toSum<T extends { type: string; data: unknown }>(
  value: T,
): { tag: T["type"]; payload: T["data"] };

export const s = toSum({ tag: "circle", payload: 1 });
