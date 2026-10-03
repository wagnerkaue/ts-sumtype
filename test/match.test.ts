import { describe, it, expect } from "vitest";
import { ok, err, errVariant, variant, map, tryMatch, type Step, type Sum } from "../src/index";

type Value = Sum<{ count: number; label: string }>;

const describeValue: Step<Value, string, Sum<{ label: "empty" }>> = tryMatch({
  count: map((n) => `${n} items`),
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
