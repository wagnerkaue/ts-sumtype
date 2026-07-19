const assert = require("node:assert/strict");
const { present, none, matchTag, variant, unwrap, fromFlat } = require("../dist/index.cjs");

assert.equal(unwrap(present(2)), 2);
assert.equal(matchTag(variant("idle"), { idle: "quiet" }, "other"), "quiet");
assert.equal(none().tag, "none");
assert.deepEqual(fromFlat("type", { type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});
console.log("smoke cjs: ok");
