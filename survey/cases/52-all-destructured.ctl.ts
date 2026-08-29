// @case    all-destructured
// @feature hand-written collector
// @kind    mistake
// @title   The returned Result destructured as a tuple
// @intent  Collect two results into a pair; the author destructures the return value directly.

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

declare function all<A, B>(items: [Res<A>, Res<B>]): Res<[A, B]>;

declare const a: Res<number>;
declare const b: Res<string>;

const [x, y] = all([a, b]);

export { x, y };
