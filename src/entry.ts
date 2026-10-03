/** A key paired with its payload: one field of a record, kept in order and named where it fails. */
export type Entry<V> = { readonly key: string; readonly payload: V };

/** The entries of record `R`, each key paired with its own payload's type. */
export type EntriesOf<R> = readonly {
  [K in keyof R & string]: { readonly key: K; readonly payload: R[K] };
}[keyof R & string][];

/** Lists a record's keys with their payloads, in the record's own order. */
export function entries<const R extends Readonly<Record<string, unknown>>>(record: R): EntriesOf<R> {
  return Object.entries(record).map(([key, payload]) => ({ key, payload })) as EntriesOf<R>;
}
