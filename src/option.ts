import { variant, isVariant, type Variant } from "./variant";
import { type Present } from "./present";
import { type Result } from "./result";

/** The absent case of an `Option`. */
export type None = Variant<"none">;
/** A value that may be absent. */
export type Option<T> = Present<T> | None;

/** Builds the absent case. Returns a fresh object each call — compare by tag, not `===`. */
export function none<T = never>(): Option<T> {
  return variant("none");
}

/** Type guard: true when `o` is the absent case, narrowing to `None`. */
export function isNone<T>(o: Option<T>): o is None {
  return isVariant(o, "none");
}

/** `Present → Present` unchanged, `None → Err(error)`. */
export function presentOr<T, E>(o: Option<T>, error: E): Result<T, E> {
  return isVariant(o, "present") ? o : variant("error", error);
}
