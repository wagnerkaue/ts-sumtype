import assert from "node:assert/strict";
import { present, err, none, matchTag, variant, tagged, chain, unwrap, all, fromFlat, fromKeyed, fromEnum } from "../dist/index.js";

const pipeline = chain(present(2))
  .andThen((x) => (x > 0 ? present(x * 10) : err("neg")))
  .map((x) => x + 1)
  .done();
assert.deepEqual(pipeline, { tag: "present", present: 21 });
assert.equal(unwrap(pipeline), 21);

assert.equal(matchTag(variant("idle"), { idle: "quiet" }, () => "other"), "quiet");
assert.equal(JSON.stringify(present(1)), '{"tag":"present","present":1}');

const httpErr = tagged("error");
assert.deepEqual(httpErr("http", { status: 500 }), {
  tag: "error",
  error: { tag: "http", http: { status: 500 } },
});

assert.deepEqual(all([present(1), present(2)]), { tag: "present", present: [1, 2] });
assert.deepEqual(all([present(1), none()]), { tag: "none", none: undefined });

assert.deepEqual(fromFlat("type", { type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});
assert.deepEqual(fromKeyed("kind", "data", { kind: "video", data: { duration: 4 } }), {
  tag: "video",
  video: { duration: 4 },
});
assert.deepEqual(fromEnum("active"), { tag: "active", active: undefined });

console.log("smoke esm: ok");
