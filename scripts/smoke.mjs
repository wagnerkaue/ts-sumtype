import assert from "node:assert/strict";
import { format } from "prettier";
import * as rPlugin from "../dist/prettier.js";
import { ok, errVariant, variant, tagged, unwrap, fromFlat, fromKeyed, fromEnum, isErr, patch, match, tryMatch, tryMap, tryReduce, r, infallible } from "../dist/index.js";

function pipeline(x) {
  const doubled = x > 0 ? ok(x * 10) : errVariant("neg", null);
  if (isErr(doubled)) return doubled;
  return ok(doubled.ok + 1);
}
assert.deepEqual(pipeline(2), { tag: "ok", ok: 21 });
assert.equal(unwrap(pipeline(2)), 21);

assert.equal(variant("idle", null).tag, "idle");
assert.equal(JSON.stringify(ok(1)), '{"tag":"ok","ok":1}');
assert.equal(JSON.stringify(variant("idle", null)), '{"tag":"idle","idle":null}'); // payload key survives JSON even when empty

const httpErr = tagged("error");
assert.deepEqual(httpErr("http", { status: 500 }), {
  tag: "error",
  error: { tag: "http", http: { status: 500 } },
});


assert.deepEqual(patch({ holder: "ada", card: { number: "4111" } }, { card: { number: Number } }), { holder: "ada", card: { number: 4111 } });
assert.equal(match({ square: () => 4, triangle: () => 3 })(variant("triangle")), 3);
const doubled = match({ leaf: (n) => n, wrap: (inner) => doubled(inner) * 2 });
assert.equal(doubled(variant("wrap", variant("leaf", 3))), 6);
assert.deepEqual(tryMap([1, -1], (n) => (n < 0 ? { tag: "error", error: "negative" } : { tag: "ok", ok: n * 2 })), { tag: "error", error: { at: 1, error: "negative" } });
assert.deepEqual(tryReduce([1, 2, 3], (sum, n) => ({ tag: "ok", ok: sum + n }), 0), { tag: "ok", ok: 6 });
const size = tryMatch({ one: infallible(() => 1), many: (n) => (n < 0 ? errVariant("negative") : ok(n)) });
assert.deepEqual(size(variant("many", 3)), { tag: "ok", ok: 3 });
assert.deepEqual(size(variant("many", -1)), { tag: "error", error: { tag: "many", many: { tag: "negative", negative: null } } });
const half = (n) => r(($) => (n % 2 === 0 ? n / 2 : $.fail("odd")));
assert.deepEqual(half(4), { tag: "ok", ok: 2 });
assert.deepEqual(half(3), { tag: "error", error: { tag: "odd", odd: null } });

assert.deepEqual(fromFlat("type")({ type: "video", duration: 4 }), {
  tag: "video",
  video: { duration: 4 },
});
assert.deepEqual(fromKeyed("kind", "data")({ kind: "video", data: { duration: 4 } }), {
  tag: "video",
  video: { duration: 4 },
});
assert.deepEqual(fromEnum("active"), { tag: "active", active: null });

const unformatted = "const half = (n: number): R =>\n  r(($) => {\n    return n / 2;\n  });\n";
const formatted = await format(unformatted, { parser: "typescript", plugins: [rPlugin] });
assert.equal(formatted, "const half = (n: number): R => r(($) => {\n  return n / 2;\n});\n");

console.log("smoke esm: ok");
