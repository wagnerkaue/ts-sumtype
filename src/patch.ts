declare const rejected: unique symbol;

/**
 * The changes to make to an `S`: for each part to change, a function, or for a record, its own
 * `Patch`. No changes object has the `rejected` key, so `C` has one only when TypeScript rejected
 * the changes and fell back to this type, which is what `Settled` reads.
 */
export type Patch<S> = {
  readonly [K in keyof S]?: ((part: S[K]) => unknown) | RecordPatch<S[K]>;
} & { readonly [rejected]?: never };

type RecordPatch<P> = P extends readonly unknown[] | ((...args: never) => unknown)
  ? never
  : P extends object
    ? Patch<P>
    : never;

/** `S` with each part `C` changes replaced by what its function returns. */
export type Patched<S, C> = {
  [K in keyof S]: K extends keyof C
    ? C[K] extends (part: never) => infer B
      ? B
      : Patched<S[K], C[K]>
    : S[K];
};

/** `T`, or `never` for rejected changes, so the mistake is reported once, where it's written. */
type Settled<C, T> = typeof rejected extends keyof C ? never : T;

type UntypedRecord = Readonly<Record<string, unknown>>;

function patchPart(part: unknown, change: unknown): unknown {
  if (typeof change === "function") return change(part);
  return typeof part === "object" && part !== null
    ? patchRecord(part as UntypedRecord, change as UntypedRecord)
    : part;
}

function patchRecord(whole: UntypedRecord, changes: UntypedRecord): UntypedRecord {
  const patched: Record<string, unknown> = { ...whole };
  for (const [key, change] of Object.entries(changes)) {
    if (Object.hasOwn(whole, key)) patched[key] = patchPart(whole[key], change);
  }
  return patched;
}

/**
 * A copy of `whole` with each part `changes` names replaced by what its function returns, at any
 * depth: `patch(form, { holder: (holder) => holder.toUpperCase(), card: { expiry: Number } })`.
 * A key `whole` doesn't have is skipped, so a change for one case of a sum leaves the other cases
 * as they are.
 */
export function patch<S extends object, const C extends Patch<S>>(whole: S, changes: C): Settled<C, Patched<S, C>> {
  return patchRecord(whole as UntypedRecord, changes as UntypedRecord) as Settled<C, Patched<S, C>>;
}
