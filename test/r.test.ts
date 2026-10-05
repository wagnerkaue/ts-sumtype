import { describe, it, expect } from "vitest";
import { ok, errVariant, r, type Result, type Sum, type Unit } from "../src/index";

type NameErr = Sum<{ empty: Unit; tooLong: number }>;
type SignupErr = Sum<{ name: NameErr; notAgreed: Unit }>;

function parseName(text: string): Result<string, NameErr> {
  return r(($) => {
    if (text === "") return $.fail("empty");
    if (text.length > 5) return $.fail("tooLong", text.length);
    return text.toUpperCase();
  });
}

function signup(form: { name: string; agreed: boolean }): Result<{ name: string }, SignupErr> {
  return r(($) => {
    if (!form.agreed) return $.fail("notAgreed");
    return { name: $.try(parseName(form.name), "name") };
  });
}

describe("r", () => {
  it("returns what the body returns as the success value", () => {
    expect(parseName("ada")).toEqual(ok("ADA"));
  });

  it("fails with a case that carries no payload", () => {
    expect(parseName("")).toEqual(errVariant("empty"));
  });

  it("fails with a case and its payload", () => {
    expect(parseName("abcdefg")).toEqual(errVariant("tooLong", 7));
  });

  it("try gives the success value", () => {
    expect(signup({ name: "ada", agreed: true })).toEqual(ok({ name: "ADA" }));
  });

  it("try leaves the body with the error under its tag", () => {
    expect(signup({ name: "", agreed: true })).toEqual(errVariant("name", errVariant("empty").error));
  });

  it("a failure through the outer $ inside a nested r reaches the outer r", () => {
    let innerReturned = false;
    const outer = (): Result<number, Sum<{ outer: Unit }>> =>
      r(($outer) => {
        const inner = (): Result<number, Sum<{ inner: Unit }>> => r(() => $outer.fail("outer"));
        inner();
        innerReturned = true;
        return 1;
      });
    expect(outer()).toEqual(errVariant("outer"));
    expect(innerReturned).toBe(false);
  });

  it("rethrows anything else thrown in the body", () => {
    const thrower = (): Result<number, NameErr> =>
      r(() => {
        throw new RangeError("boom");
      });
    expect(thrower).toThrow(RangeError);
  });
});
