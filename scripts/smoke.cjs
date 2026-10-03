const assert = require("node:assert/strict");
const { ok, some, none, someOr, variant, unwrap, fromFlat, flow, map, rejectIf, zoom, matchTag } = require("../dist/index.cjs");
const { flow: flowEntry, map: mapEntry } = require("../dist/flow.cjs");

assert.equal(unwrap(ok(2)), 2);
assert.equal(unwrap(someOr(some(3), "missing")), 3);
assert.equal(variant("idle", null).tag, "idle");
assert.equal(none().tag, "none");
assert.deepEqual(fromFlat("type")({ type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});

const positive = flow(rejectIf((n) => n <= 0, "notPositive"), map((n) => n * 2));
assert.deepEqual(positive(2), { tag: "ok", ok: 4 });
assert.deepEqual(positive(0), { tag: "error", error: { tag: "notPositive", notPositive: null } });
assert.deepEqual(zoom("card", zoom(0, map(Number)))({ card: ["4111", "x"] }), { tag: "ok", ok: { card: [4111, "x"] } });
const size = matchTag({ one: map(() => 1), many: rejectIf((n) => n < 0, "negative") });
assert.deepEqual(size(variant("many", 3)), { tag: "ok", ok: 3 });
assert.deepEqual(size(variant("many", -1)), { tag: "error", error: { tag: "many", many: { tag: "negative", negative: null } } });
assert.deepEqual(flowEntry(mapEntry((n) => n + 1))(1), { tag: "ok", ok: 2 });
console.log("smoke cjs: ok");
