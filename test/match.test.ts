import { describe, it, expect, vi } from "vitest";
import { ok, err, errVariant, variant, some, none, match, tryMatch, mapCases, type Option, type Fallible, type Sum, type Unit } from "../src/index";

type Value = Sum<{ count: number; label: string }>;

const describeValue: Fallible<Value, string, Sum<{ label: "empty" }>> = tryMatch({
  count: (n) => ok(`${n} items`),
  label: (text) => (text === "" ? err("empty") : ok(`label ${text}`)),
});

describe("tryMatch", () => {
  it("passes the payload to the handler for the value's tag", () => {
    expect(describeValue(variant("count", 3))).toEqual(ok("3 items"));
    expect(describeValue(variant("label", "x"))).toEqual(ok("label x"));
  });

  it("wraps a handler's error under its tag", () => {
    expect(describeValue(variant("label", ""))).toEqual(errVariant("label", "empty"));
  });
});

type Path = Sum<{ here: Unit; into: { key: string; rest: Path } }>;

const dottedRest: (path: Path) => string = match({
  here: () => "",
  into: ({ key, rest }) => `.${key}${dottedRest(rest)}`,
});

const dotted: (path: Path) => string = match({
  here: () => "",
  into: ({ key, rest }) => key + dottedRest(rest),
});

const dottedSegment: (path: Path) => Option<string> = match({
  here: () => none(),
  into: ({ key, rest }) => (key.includes(".") ? some(key) : dottedSegment(rest)),
});

const paymentCard: Path = variant("into", { key: "payment", rest: variant("into", { key: "card", rest: variant("here") }) });

describe("match", () => {
  it("hands the payload to the handler for the value's tag", () => {
    expect(dotted(paymentCard)).toBe("payment.card");
    expect(dotted(variant("here"))).toBe("");
  });

  it("returns what the handler returns, an Option included", () => {
    expect(dottedSegment(variant("into", { key: "a.b", rest: variant("here") }))).toEqual(some("a.b"));
    expect(dottedSegment(paymentCard)).toEqual(none());
  });
});

type Expr = Sum<{ column: string; literal: string; isNull: Expr; or: readonly Expr[] }>;

const prefixColumns = (prefix: string, expr: Expr): Expr => {
  const prefixed = (inner: Expr) => prefixColumns(prefix, inner);
  return mapCases(expr, {
    column: (name) => `${prefix}.${name}`,
    literal: (text) => text,
    isNull: prefixed,
    or: (items) => items.map(prefixed),
  });
};

describe("mapCases", () => {
  it("keeps the tag and replaces the payload with what its handler returns", () => {
    expect(prefixColumns("payment", variant("column", "tag"))).toEqual(variant("column", "payment.tag"));
    expect(prefixColumns("payment", variant("literal", "cash"))).toEqual(variant("literal", "cash"));
  });

  it("reaches nested cases through the handlers", () => {
    const expr: Expr = variant("or", [variant("isNull", variant("column", "email")), variant("literal", "x")]);
    expect(prefixColumns("payment", expr)).toEqual(
      variant("or", [variant("isNull", variant("column", "payment.email")), variant("literal", "x")]),
    );
  });

  it("changes a payload's type", () => {
    const shape = variant("fields", ["a", "b"]) as Sum<{ fields: readonly string[]; empty: Unit }>;
    expect(mapCases(shape, { fields: (fields) => fields.length, empty: (empty) => empty })).toEqual(
      variant("fields", 2),
    );
  });

  it("runs only the handler for the value's case", () => {
    const column = vi.fn((name: string) => name);
    const literal = vi.fn((text: string) => text);
    mapCases(variant("literal", "x") as Sum<{ column: string; literal: string }>, { column, literal });
    expect(column).not.toHaveBeenCalled();
    expect(literal).toHaveBeenCalledWith("x");
  });
});
