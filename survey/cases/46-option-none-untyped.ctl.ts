// @case    option-none-untyped
// @feature nullable local
// @kind    mistake
// @title   none() with no type argument, reassigned later
// @intent  Start with an empty value and fill it in later. Plain TypeScript needs no annotation on the absent case; `let o = null` even becomes an evolving `any`.

let o: string | undefined = undefined;
o = "hello";

export { o };
