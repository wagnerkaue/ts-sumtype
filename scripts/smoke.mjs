import assert from "node:assert/strict";
import { ok, errVariant, variant, tagged, unwrap, allResults, fromFlat, fromKeyed, fromEnum, isErr } from "../dist/index.js";

function pipeline(x) {
  const doubled = x > 0 ? ok(x * 10) : errVariant({ neg: null });
  if (isErr(doubled)) return doubled;
  return ok(doubled.ok + 1);
}
assert.deepEqual(pipeline(2), { tag: "ok", ok: 21 });
assert.equal(unwrap(pipeline(2)), 21);

assert.equal(variant({ idle: null }).tag, "idle");
assert.equal(JSON.stringify(ok(1)), '{"tag":"ok","ok":1}');
assert.equal(JSON.stringify(variant({ idle: null })), '{"tag":"idle","idle":null}'); // payload key survives JSON even when empty

const httpErr = tagged("error");
assert.deepEqual(httpErr({ http: { status: 500 } }), {
  tag: "error",
  error: { tag: "http", http: { status: 500 } },
});

assert.deepEqual(allResults([ok(1), ok(2)]), { tag: "ok", ok: [1, 2] });

assert.deepEqual(fromFlat("type")({ type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});
assert.deepEqual(fromKeyed("kind", "data")({ kind: "video", data: { duration: 4 } }), {
  tag: "video",
  video: { duration: 4 },
});
assert.deepEqual(fromEnum("active"), { tag: "active", active: null });

console.log("smoke esm: ok");
