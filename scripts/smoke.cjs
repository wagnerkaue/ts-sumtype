const assert = require("node:assert/strict");
const { ok, some, none, someOr, variant, unwrap, fromFlat, flow, tryFlow, step, lazy, rejectIf, tryOver, match, tryMatch } = require("../dist/index.cjs");
const { tryFlow: flowEntry, step: stepEntry } = require("../dist/flow.cjs");

assert.equal(unwrap(ok(2)), 2);
assert.equal(unwrap(someOr(some(3), "missing")), 3);
assert.equal(variant("idle", null).tag, "idle");
assert.equal(none().tag, "none");
assert.deepEqual(fromFlat("type")({ type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});

assert.equal(flow((n) => n + 1, (n) => n * 10)(2), 30);
const positive = tryFlow(rejectIf((n) => n <= 0, "notPositive"), step((n) => n * 2));
assert.deepEqual(positive(2), { tag: "ok", ok: 4 });
assert.deepEqual(positive(0), { tag: "error", error: { tag: "notPositive", notPositive: null } });
assert.deepEqual(tryOver("card", tryOver(0, step(Number)))({ card: ["4111", "x"] }), { tag: "ok", ok: { card: [4111, "x"] } });
assert.equal(match({ square: () => 4, triangle: () => 3 })(variant("triangle")), 3);
const doubled = match({ leaf: (n) => n, wrap: flow(lazy(() => doubled), (n) => n * 2) });
assert.equal(doubled(variant("wrap", variant("leaf", 3))), 6);
const size = tryMatch({ one: step(() => 1), many: rejectIf((n) => n < 0, "negative") });
assert.deepEqual(size(variant("many", 3)), { tag: "ok", ok: 3 });
assert.deepEqual(size(variant("many", -1)), { tag: "error", error: { tag: "many", many: { tag: "negative", negative: null } } });
assert.deepEqual(flowEntry(stepEntry((n) => n + 1))(1), { tag: "ok", ok: 2 });
console.log("smoke cjs: ok");
