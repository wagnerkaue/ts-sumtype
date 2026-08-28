// @case    baseline-pipe-chain
// @feature hand-written early-return chain
// @kind    baseline
// @title   Correct three-step pipe
// @intent  Reference point: parse, validate, format -- each step lines up with the last.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

const parse = (raw: string): Res<number> => {
  const n = Number(raw);
  return Number.isNaN(n) ? { ok: false, error: "not a number" } : { ok: true, value: n };
};
const validate = (n: number): Res<number> =>
  n > 0 ? { ok: true, value: n } : { ok: false, error: "not positive" };
const format = (n: number): string => n.toFixed(2);

export function run(raw: string): Res<string> {
  const a = parse(raw);
  if (!a.ok) return a;
  const b = validate(a.value);
  if (!b.ok) return b;
  return { ok: true, value: format(b.value) };
}
