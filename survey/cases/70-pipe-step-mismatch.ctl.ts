// @case    pipe-step-mismatch
// @feature hand-written early-return chain
// @kind    mistake
// @title   A step's input does not match the previous step's output
// @intent  Parse, then round; the author forgets the middle step turned the number into a string.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

const parse = (raw: string): Res<number> =>
  Number.isNaN(Number(raw)) ? { ok: false, error: "not a number" } : { ok: true, value: Number(raw) };
const show = (n: number): string => n.toFixed(2);
const round = (n: number): number => Math.round(n);

export function run(raw: string): Res<number> {
  const a = parse(raw);
  if (!a.ok) return a;
  const b = show(a.value);
  return { ok: true, value: round(b) };
}
