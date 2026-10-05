// @case    tryflatmap-located-by-index
// @feature hand-written loop
// @kind    mistake
// @title   A failure located at the index where the declared error expects a key
// @intent  Collect each field's columns, reporting a failing field by its key; the author leaves out the function that names it.

type Res<T, E> = { ok: true; value: T } | { ok: false; error: E };
type Field = { readonly key: string; readonly size: number };
type FieldErr = "empty";

const columns = (field: Field): Res<string[], FieldErr> =>
  field.size === 0 ? { ok: false, error: "empty" } : { ok: true, value: [field.key] };

export function allColumns(fields: readonly Field[]): Res<string[], { at: string; error: FieldErr }> {
  const collected: string[] = [];
  for (let index = 0; index < fields.length; index++) {
    const result = columns(fields[index]);
    if (!result.ok) return { ok: false, error: { at: index, error: result.error } };
    collected.push(...result.value);
  }
  return { ok: true, value: collected };
}
