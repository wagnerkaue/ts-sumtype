// @case    unwrap-non-sum
// @feature hand-written unwrap
// @kind    mistake
// @title   unwrap() applied to a variant that is not a Result
// @intent  Pull the payload out of a tagged value; unwrap takes a `Result`.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

function unwrap<T>(r: Res<T>): T {
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

const v = { kind: "count", count: 3 } as const;

export const n = unwrap(v).toFixed(2);
