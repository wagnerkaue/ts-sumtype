// @case    unwrapor-wrong-fallback
// @feature ternary fallback
// @kind    mistake
// @title   Fallback of the wrong type
// @intent  Default a numeric Result to a placeholder; the placeholder is a string.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

declare const r: Res<number>;

export const n: number = r.ok ? r.value : "zero";
