const assert = require("node:assert/strict");
const { ok, errVariant, some, none, someOr, variant, unwrap, fromFlat, patch, match, tryMatch, tryMap, tryReduce, r } = require("../dist/index.cjs");
const { tryMap: tryMapEntry } = require("../dist/list.cjs");
const { r: rEntry } = require("../dist/r.cjs");

assert.equal(unwrap(ok(2)), 2);
assert.equal(unwrap(someOr(some(3), "missing")), 3);
assert.equal(variant("idle", null).tag, "idle");
assert.equal(none().tag, "none");
assert.deepEqual(fromFlat("type")({ type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});

assert.deepEqual(patch({ holder: "ada", card: { number: "4111" } }, { card: { number: Number } }), { holder: "ada", card: { number: 4111 } });
assert.equal(match({ square: () => 4, triangle: () => 3 })(variant("triangle")), 3);
const doubled = match({ leaf: (n) => n, wrap: (inner) => doubled(inner) * 2 });
assert.equal(doubled(variant("wrap", variant("leaf", 3))), 6);
assert.deepEqual(tryMap((n) => (n < 0 ? { tag: "error", error: "negative" } : { tag: "ok", ok: n * 2 }), "item")([1, -1]), { tag: "error", error: { tag: "item", item: { at: 1, error: "negative" } } });
assert.deepEqual(tryReduce((sum, n) => ({ tag: "ok", ok: sum + n }), 0, "term")([1, 2, 3]), { tag: "ok", ok: 6 });
const size = tryMatch({ one: () => ok(1), many: (n) => (n < 0 ? errVariant("negative") : ok(n)) });
assert.deepEqual(size(variant("many", 3)), { tag: "ok", ok: 3 });
assert.deepEqual(size(variant("many", -1)), { tag: "error", error: { tag: "many", many: { tag: "negative", negative: null } } });
assert.deepEqual(tryMapEntry((n) => ok(n + 1), "item")([1]), { tag: "ok", ok: [2] });
const half = (n) => r(($) => (n % 2 === 0 ? n / 2 : $.fail("odd")));
assert.deepEqual(half(4), { tag: "ok", ok: 2 });
assert.deepEqual(half(3), { tag: "error", error: { tag: "odd", odd: null } });
assert.deepEqual(rEntry(($) => $.try({ tag: "ok", ok: 1 }, "never")), { tag: "ok", ok: 1 });
console.log("smoke cjs: ok");
