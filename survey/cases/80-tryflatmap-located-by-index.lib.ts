// @case    tryflatmap-located-by-index
// @feature tryFlatMap() without at
// @kind    mistake
// @title   A failure located at the index where the declared error expects a key
// @intent  Collect each field's columns, reporting a failing field by its key; the author leaves out the function that names it.

import { tryFlatMap, err, ok, type At, type Result } from "ts-sumtype";

type Field = { readonly key: string; readonly size: number };
type FieldErr = "empty";

const columns = (field: Field) => (field.size === 0 ? err<FieldErr>("empty") : ok([field.key]));

export function allColumns(fields: readonly Field[]): Result<readonly string[], At<string, FieldErr>> {
  return tryFlatMap(fields, columns);
}
