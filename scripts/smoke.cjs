const assert = require("node:assert/strict");
const { ok, some, none, someOr, variant, unwrap, fromFlat } = require("../dist/index.cjs");

assert.equal(unwrap(ok(2)), 2);
assert.equal(unwrap(someOr(some(3), "missing")), 3);
assert.equal(variant({ idle: null }).tag, "idle");
assert.equal(none().tag, "none");
assert.deepEqual(fromFlat("type")({ type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});
console.log("smoke cjs: ok");
