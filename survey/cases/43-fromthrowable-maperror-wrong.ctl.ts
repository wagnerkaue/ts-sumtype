// @case    fromthrowable-maperror-wrong
// @feature try/catch returning a Result
// @kind    mistake
// @title   mapError produces the wrong error type
// @intent  Catch a throw into a Result<number, string>; the mapper returns an Error.

type Res<T, E> = { ok: true; value: T } | { ok: false; error: E };

declare function risky(): number;

export function attempt(): Res<number, string> {
  try {
    return { ok: true, value: risky() };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}
