// @case    pipeoption-bare-undefined
// @feature optional chaining
// @kind    mistake
// @title   A step returns undefined instead of none()
// @intent  Drop non-positive numbers from the chain; the author returns undefined and then keeps going.

const keepPositive = (n: number): number | undefined => (n > 0 ? n : undefined);
const show = (n: number): string => n.toFixed(2);

export const out = show(keepPositive(3));
