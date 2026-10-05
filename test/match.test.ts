import { describe, it, expect } from "vitest";
import { ok, err, errVariant, variant, some, none, match, tryMatch, type Option, type Fallible, type Sum, type Unit } from "../src/index";

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
