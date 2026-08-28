const assert = require("node:assert/strict");
const { some, none, variant, unwrap, fromFlat } = require("../dist/index.cjs");

assert.equal(unwrap(some(2)), 2);
assert.equal(variant({ idle: null }).tag, "idle");
assert.equal(none().tag, "none");
assert.deepEqual(fromFlat("type")({ type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});
console.log("smoke cjs: ok");
