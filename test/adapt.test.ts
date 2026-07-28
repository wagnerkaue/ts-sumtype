import { describe, it, expect } from "vitest";
import { fromFlat, fromKeyed, fromEnum } from "../src/index";

describe("fromFlat", () => {
  it("moves every key but the discriminant under the tag-named key", () => {
    expect(fromFlat("type")({ type: "video", duration: 4, size: 1024 })).toEqual({
      tag: "video",
      video: { duration: 4, size: 1024 },
    });
  });

  it("handles a union member with no extra keys", () => {
    expect(fromFlat("type")({ type: "idle" })).toEqual({ tag: "idle", idle: {} });
  });

  it("returns a reusable converter", () => {
    const toVariant = fromFlat("type");
    expect(toVariant({ type: "video", duration: 4, size: 1024 })).toEqual({
      tag: "video",
      video: { duration: 4, size: 1024 },
    });
    expect(toVariant({ type: "message", text: "hi" })).toEqual({
      tag: "message",
      message: { text: "hi" },
    });
  });

  it("is safe to pass to Array.prototype.map", () => {
    const items = [
      { type: "video", duration: 4, size: 1024 },
      { type: "message", text: "hi" },
    ];
    expect(items.map(fromFlat("type"))).toEqual([
      { tag: "video", video: { duration: 4, size: 1024 } },
      { tag: "message", message: { text: "hi" } },
    ]);
  });
});

describe("fromKeyed", () => {
  it("renames the tag key and picks the payload key", () => {
    expect(fromKeyed("kind", "data")({ kind: "video", data: { duration: 4 } })).toEqual({
      tag: "video",
      video: { duration: 4 },
    });
  });

  it("leaves any other keys on the source object behind", () => {
    expect(
      fromKeyed("kind", "data")({ kind: "video", data: { duration: 4 }, extra: "ignored" }),
    ).toEqual({ tag: "video", video: { duration: 4 } });
  });

  it("returns a reusable converter", () => {
    const toVariant = fromKeyed("kind", "data");
    expect(toVariant({ kind: "video", data: { duration: 4 } })).toEqual({
      tag: "video",
      video: { duration: 4 },
    });
  });
});

describe("fromEnum", () => {
  it("wraps a bare string as a unit variant", () => {
    expect(fromEnum("active")).toEqual({ tag: "active", active: null });
  });

  it("is safe to pass to Array.prototype.map (unlike variant, ignores index/array args)", () => {
    const statuses = ["active", "pending", "inactive"];
    expect(statuses.map(fromEnum)).toEqual([
      { tag: "active", active: null },
      { tag: "pending", pending: null },
      { tag: "inactive", inactive: null },
    ]);
  });
});
