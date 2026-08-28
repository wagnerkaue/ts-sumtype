// @case    fromnullable-overload-confusion
// @feature manual null check
// @kind    mistake
// @title   One-argument form used where a Result was wanted
// @intent  Turn a nullable into a Result; the author leaves the absent branch as `null`.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

declare const name: string | null;

export const r: Res<string> = name != null ? { ok: true, value: name } : null;
