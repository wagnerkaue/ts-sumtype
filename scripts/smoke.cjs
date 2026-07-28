const assert = require("node:assert/strict");
const { some, none, matchTag, variant, unwrap, fromFlat } = require("../dist/index.cjs");

assert.equal(unwrap(some(2)), 2);
assert.equal(matchTag(variant({ idle: null }), { idle: "quiet" }, "other"), "quiet");
assert.equal(none().tag, "none");
assert.deepEqual(fromFlat("type")({ type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});
console.log("smoke cjs: ok");
