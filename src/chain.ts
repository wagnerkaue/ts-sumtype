import { present, type Present } from "./present";
import type { Variant } from "./variant";

type PresentOf<R> = R extends Present<infer U> ? U : never;
type HaltOf<R> = Exclude<R, Present<unknown>>;

const isPresent = (v: unknown): v is Present<unknown> =>
  typeof v === "object" && v !== null && (v as { tag?: unknown }).tag === "present";

/** Internal accumulator behind `chain` — use `chain(...)`, not this class, directly. */
class Chain<T, S> {
  private constructor(
    private readonly state: { stopped: false; value: T } | { stopped: true; value: S },
  ) {}

  static start<R extends Variant<string, unknown>>(value: R): Chain<PresentOf<R>, HaltOf<R>> {
    if (isPresent(value)) return new Chain<PresentOf<R>, HaltOf<R>>({ stopped: false, value: value.present as PresentOf<R> });
    return new Chain<PresentOf<R>, HaltOf<R>>({ stopped: true, value: value as HaltOf<R> });
  }

  /** Runs `f` on the current value and continues with its payload; a non-`Present` result halts the chain. */
  andThen<R extends Variant<string, unknown>>(f: (v: T) => R): Chain<PresentOf<R>, S | HaltOf<R>> {
    if (this.state.stopped) return this as Chain<PresentOf<R>, S | HaltOf<R>>;
    const out = f(this.state.value);
    if (isPresent(out)) return new Chain<PresentOf<R>, S | HaltOf<R>>({ stopped: false, value: out.present as PresentOf<R> });
    return new Chain<PresentOf<R>, S | HaltOf<R>>({ stopped: true, value: out as S | HaltOf<R> });
  }

  /** Transforms the current value in place; never halts the chain. */
  map<U>(f: (v: T) => U): Chain<U, S> {
    if (this.state.stopped) return new Chain<U, S>(this.state as { stopped: true; value: S });
    return new Chain<U, S>({ stopped: false, value: f(this.state.value) });
  }

  /** Ends the chain, returning the final `Present` or whatever halted it. */
  done(): Present<T> | S {
    if (this.state.stopped) return this.state.value;
    return present(this.state.value);
  }
}

/** Starts a chain from a `Present`, `Result`, or `Option`; thread with `.andThen`/`.map`, end with `.done()`. */
export function chain<R extends Variant<string, unknown>>(value: R): Chain<PresentOf<R>, HaltOf<R>>;
export function chain(value: any): any {
  return Chain.start(value);
}
