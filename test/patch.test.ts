import { describe, it, expect } from "vitest";
import { patch, variant, type Sum, type Unit } from "../src/index";

type Form = {
  readonly holder: string;
  readonly card: { readonly number: string; readonly expiry: { readonly month: string; readonly year: string } };
  readonly note?: { readonly text: string };
};

const form: Form = { holder: "ada", card: { number: "4111", expiry: { month: "04", year: "30" } } };

describe("patch", () => {
  it("changes several parts at once, at any depth", () => {
    expect(patch(form, { holder: (holder) => holder.toUpperCase(), card: { expiry: { month: Number } } })).toEqual({
      holder: "ADA",
      card: { number: "4111", expiry: { month: 4, year: "30" } },
    });
  });

  it("leaves the original as it is", () => {
    patch(form, { card: { number: () => "5500" } });
    expect(form.card.number).toBe("4111");
  });

  it("skips a part the value doesn't have", () => {
    expect(patch(form, { note: { text: (text) => text.trim() } })).toEqual(form);
    const withoutNote: Form = { ...form, note: undefined };
    expect(patch(withoutNote, { note: { text: (text) => text.trim() } }).note).toBeUndefined();
  });

  it("changes only the sum's case that has the key", () => {
    type Shape = Sum<{ fields: readonly string[]; empty: Unit }>;
    const count = (shape: Shape) => patch(shape, { fields: (fields) => fields.length });
    expect(count(variant("fields", ["a", "b"]))).toEqual({ tag: "fields", fields: 2 });
    expect(count(variant("empty"))).toEqual({ tag: "empty", empty: null });
  });
});
