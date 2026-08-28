#!/usr/bin/env node
// Compiles every file in survey/cases and reports the diagnostics verbatim.
//
//   node survey/run.mjs            compile the cases and print the table
//   node survey/run.mjs <slug>     print one case's diagnostics in full
//   node survey/run.mjs --check    compare against baseline.json; non-zero exit on any change
//   node survey/run.mjs --bless    record the current diagnostics as the new baseline
//   --no-build                     reuse the dist that is already there (any mode)

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const surveyDir = dirname(fileURLToPath(import.meta.url));
const repoDir = join(surveyDir, "..");
const casesDir = join(surveyDir, "cases");

// Internal type names a user never wrote and cannot look up in their own code. Their presence
// in a diagnostic is the automatable proxy for "this message is about the library's insides".
const INTERNAL_NAMES = [
  "CasesMixed", "ArmResults", "FallbackResult", "HandlerPayload", "NotFn", "Rest<",
  "FrozenArray", "Frozen<", "SingleKeyed", "ExtractVariant", "PayloadOf", "NestVariant",
  "ErrShape", "AnyResult", "ValuesOf", "ErrorsOf", "ValueOf", "HaltOf",
  "UnwrapOk", "UnwrapSome", "HaltErr", "HaltNone", "EnsureOk", "EnsureSome",
  "Unflattened", "Rekeyed",
];

// `Sum<{ a: X }>` prints as `{ readonly tag: "a" } & Pick<{ a: X }, "a">`. Every occurrence is
// one union member the reader has to decode back into the name they actually wrote.
const SUM_EXPANSION = /Pick</g;

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: repoDir, encoding: "utf8", ...opts });
}

// ── 1. build ──────────────────────────────────────────────────────────────────

if (!process.argv.includes("--no-build")) {
  process.stderr.write("building dist…\n");
  sh("npm", ["run", "build"], { stdio: ["ignore", "ignore", "inherit"] });
}

const tsVersion = sh("npx", ["tsc", "--version"]).trim().replace(/^Version /, "");

// ── 2. compile ────────────────────────────────────────────────────────────────

process.stderr.write("compiling cases…\n");
let raw;
try {
  raw = sh("npx", ["tsc", "-p", "survey/tsconfig.survey.json", "--noEmit", "--pretty", "false"]);
} catch (e) {
  // tsc exits non-zero whenever it reports anything, which is the normal outcome here.
  raw = e.stdout ?? "";
  if (e.stderr) process.stderr.write(e.stderr);
}

// ── 3. parse diagnostics ──────────────────────────────────────────────────────

// A diagnostic starts at column 0 with `path(line,col): error TSxxxx:`; every following
// indented line is elaboration belonging to it.
const START = /^(\S[^(]*)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

const byFile = new Map();
let current = null;
for (const line of raw.split("\n")) {
  const m = START.exec(line);
  if (m) {
    const [, file, ln, col, code, message] = m;
    current = { file, line: +ln, col: +col, code, text: `${message}` };
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push(current);
  } else if (current && /^\s+\S/.test(line)) {
    current.text += `\n${line}`;
  } else if (line.trim() !== "") {
    current = null;
  }
}

// ── 4. assemble cases ─────────────────────────────────────────────────────────

function header(source) {
  const meta = {};
  for (const line of source.split("\n")) {
    const m = /^\/\/ @(\w+)\s+(.*)$/.exec(line);
    if (!m) break;
    meta[m[1]] = m[2].trim();
  }
  return meta;
}

function body(source) {
  return source
    .split("\n")
    .filter((l) => !/^\/\/ @\w+/.test(l))
    .join("\n")
    .trim();
}

function metrics(diags) {
  const text = diags.map((d) => d.text).join("\n");
  const lines = text === "" ? 0 : text.split("\n").length;
  const depth = Math.max(
    0,
    ...text.split("\n").map((l) => Math.floor((/^\s*/.exec(l)[0].length) / 2)),
  );
  return {
    count: diags.length,
    codes: [...new Set(diags.map((d) => d.code))],
    chars: text.length,
    lines,
    depth,
    truncated: /\.\.\./.test(text),
    overload: /No overload matches this call/.test(text),
    leaks: INTERNAL_NAMES.filter((n) => text.includes(n)).map((n) => n.replace(/[<]$/, "")),
    sumExpansions: (text.match(SUM_EXPANSION) ?? []).length,
    text,
  };
}

const files = readdirSync(casesDir).filter((f) => f.endsWith(".ts")).sort();
const cases = new Map();

for (const file of files) {
  const m = /^(\d+)-(.+)\.(lib|ctl)\.ts$/.exec(file);
  if (!m) throw new Error(`case file does not match <nn>-<slug>.(lib|ctl).ts: ${file}`);
  const [, order, slug, side] = m;
  const source = readFileSync(join(casesDir, file), "utf8");
  const meta = header(source);
  for (const key of ["case", "feature", "kind", "title", "intent"]) {
    if (!meta[key]) throw new Error(`${file}: missing @${key} header`);
  }
  if (meta.case !== slug) throw new Error(`${file}: @case "${meta.case}" does not match filename slug "${slug}"`);

  if (!cases.has(slug)) cases.set(slug, { order: +order, slug });
  const c = cases.get(slug);
  c.title ??= meta.title;
  c.intent ??= meta.intent;
  c.kind ??= meta.kind;
  c[side] = {
    file: `survey/cases/${file}`,
    feature: meta.feature,
    // Optional, per side: why this case behaves as it does. Lives next to the code it explains
    // so a diagnosis cannot drift away from the case the way a separate write-up does.
    note: meta.note ?? null,
    code: body(source),
    ...metrics(byFile.get(`survey/cases/${file}`) ?? []),
  };
}

const rows = [...cases.values()].sort((a, b) => a.order - b.order);

for (const c of rows) {
  if (!c.lib || !c.ctl) throw new Error(`case "${c.slug}" is missing its lib or ctl half`);
  // Ratio of library message size to control message size. A control that compiles clean has
  // no denominator, so those are reported separately rather than as Infinity.
  c.ratio = c.ctl.chars === 0 ? null : c.lib.chars / c.ctl.chars;
  c.anomaly =
    c.kind === "mistake" && c.lib.count === 0
      ? "library accepts the mistake silently"
      : c.kind === "mistake" && c.ctl.count === 0
        ? "plain TypeScript accepts this; only the library rejects it"
        : c.kind === "baseline" && (c.lib.count > 0 || c.ctl.count > 0)
          ? "baseline did not compile clean"
          : null;
}

// ── 5. aggregate ──────────────────────────────────────────────────────────────

const mistakes = rows.filter((c) => c.kind === "mistake");
const both = mistakes.filter((c) => c.lib.count > 0 && c.ctl.count > 0);
const summary = {
  tsVersion,
  generated: new Date().toISOString().slice(0, 10),
  pairs: rows.length,
  mistakes: mistakes.length,
  baselines: rows.length - mistakes.length,
  libChars: mistakes.reduce((n, c) => n + c.lib.chars, 0),
  ctlChars: mistakes.reduce((n, c) => n + c.ctl.chars, 0),
  libLines: mistakes.reduce((n, c) => n + c.lib.lines, 0),
  ctlLines: mistakes.reduce((n, c) => n + c.ctl.lines, 0),
  leaking: mistakes.filter((c) => c.lib.leaks.length > 0).length,
  sumExpanding: mistakes.filter((c) => c.lib.sumExpansions > 0).length,
  truncatedLib: mistakes.filter((c) => c.lib.truncated).length,
  truncatedCtl: mistakes.filter((c) => c.ctl.truncated).length,
  medianRatio: median(both.map((c) => c.lib.chars / c.ctl.chars)),
  anomalies: rows.filter((c) => c.anomaly),
};

function median(xs) {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// ── 6. baseline ───────────────────────────────────────────────────────────────

// A characterization test over the *objective* properties of each diagnostic. It deliberately
// does not assert message wording: wording drifts with every TypeScript release and would make
// the check fail for reasons that have nothing to do with this library. What it pins down is
// the shape -- whether the mistake is caught at all, under which error codes, how deep the
// elaboration runs, and whether the message drags the library's internals into view.
//
// Any movement fails, in both directions. A regression fails because it is a regression; an
// improvement fails because an improvement nobody recorded is an improvement nobody can defend
// in review. Either way the fix is to read the diff and run `--bless`.

const CHAR_TOLERANCE = (n) => Math.max(40, Math.round(n * 0.1));

const snapshot = () =>
  Object.fromEntries(
    rows.map((c) => [
      c.slug,
      {
        anomaly: c.anomaly,
        lib: side(c.lib),
        ctl: side(c.ctl),
      },
    ]),
  );

function side(s) {
  return {
    count: s.count,
    codes: s.codes,
    chars: s.chars,
    lines: s.lines,
    depth: s.depth,
    leaks: s.leaks,
    sumExpansions: s.sumExpansions,
    truncated: s.truncated,
    overload: s.overload,
  };
}

const baselinePath = join(surveyDir, "baseline.json");

if (process.argv.includes("--bless")) {
  writeFileSync(
    baselinePath,
    JSON.stringify({ tsVersion, cases: snapshot() }, null, 2) + "\n",
  );
  process.stderr.write(`blessed ${rows.length} cases into survey/baseline.json (TypeScript ${tsVersion})\n`);
  process.exit(0);
}

if (process.argv.includes("--check")) {
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const now = snapshot();
  const problems = [];

  if (baseline.tsVersion !== tsVersion) {
    process.stderr.write(
      `note: baseline recorded on TypeScript ${baseline.tsVersion}, running ${tsVersion}. ` +
        `Wording drift across versions is expected; re-bless if the diff is only that.\n\n`,
    );
  }

  for (const slug of new Set([...Object.keys(baseline.cases), ...Object.keys(now)])) {
    const was = baseline.cases[slug];
    const is = now[slug];
    if (!was) { problems.push([slug, "new case, not in the baseline"]); continue; }
    if (!is) { problems.push([slug, "case in the baseline no longer exists"]); continue; }

    if (was.anomaly !== is.anomaly) {
      problems.push([slug, `anomaly changed: ${was.anomaly ?? "none"} -> ${is.anomaly ?? "none"}`]);
    }
    for (const half of ["lib", "ctl"]) {
      const a = was[half];
      const b = is[half];
      const at = (m) => `${half}: ${m}`;
      if (a.count !== b.count) problems.push([slug, at(`${a.count} -> ${b.count} diagnostics`)]);
      if (String(a.codes) !== String(b.codes)) {
        problems.push([slug, at(`codes ${a.codes.join(" ") || "none"} -> ${b.codes.join(" ") || "none"}`)]);
      }
      if (String(a.leaks) !== String(b.leaks)) {
        problems.push([slug, at(`internal names ${a.leaks.join(", ") || "none"} -> ${b.leaks.join(", ") || "none"}`)]);
      }
      if (a.sumExpansions !== b.sumExpansions) {
        problems.push([slug, at(`Sum expansions ${a.sumExpansions} -> ${b.sumExpansions}`)]);
      }
      if (a.depth !== b.depth) problems.push([slug, at(`elaboration depth ${a.depth} -> ${b.depth}`)]);
      if (a.truncated !== b.truncated) problems.push([slug, at(`truncation ${a.truncated} -> ${b.truncated}`)]);
      if (a.overload !== b.overload) problems.push([slug, at(`overload failure ${a.overload} -> ${b.overload}`)]);
      const drift = b.chars - a.chars;
      if (Math.abs(drift) > CHAR_TOLERANCE(a.chars)) {
        problems.push([slug, at(`${a.chars} -> ${b.chars} chars (${drift > 0 ? "+" : ""}${drift})`)]);
      }
    }
  }

  if (problems.length === 0) {
    process.stderr.write(`diagnostics unchanged across ${rows.length} cases (TypeScript ${tsVersion})\n`);
    process.exit(0);
  }
  process.stderr.write(
    `${problems.length} diagnostic change${problems.length === 1 ? "" : "s"} against survey/baseline.json:\n\n` +
      problems.map(([slug, what]) => `  ${slug}\n    ${what}\n`).join("") +
      `\nRun \`node survey/run.mjs\` to regenerate the document and read the messages in full,\n` +
      `then \`node survey/run.mjs --bless\` to record these as the new baseline.\n`,
  );
  process.exit(1);
}

// ── 7. report ─────────────────────────────────────────────────────────────────
//
// Terminal output, no files. Bare run prints the table; a slug substring prints the diagnostics
// themselves, which is what you want when `--check` has just told you something moved.

const filter = process.argv.slice(2).find((a) => !a.startsWith("--"));

if (filter) {
  const hits = rows.filter((c) => c.slug.includes(filter));
  if (hits.length === 0) {
    process.stderr.write(`no case matching "${filter}"\n`);
    process.exit(1);
  }
  for (const c of hits) {
    process.stdout.write(`\n${c.slug}  (${c.kind})\n  ${c.title}\n  ${c.intent}\n`);
    for (const [label, side] of [["ts-sumtype", c.lib], ["plain TypeScript", c.ctl]]) {
      process.stdout.write(`\n  ── ${label} — ${side.feature}\n`);
      if (side.note) process.stdout.write(`  ${side.note}\n`);
      process.stdout.write(
        side.count === 0
          ? "  (no diagnostics)\n"
          : side.text.split("\n").map((l) => `  ${l}`).join("\n") +
            `\n  [${side.chars} chars, ${side.lines} lines, depth ${side.depth}]\n`,
      );
    }
  }
  process.stdout.write("\n");
  process.exit(0);
}

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

process.stdout.write(
  `${rows.length} pairs · ${summary.mistakes} mistakes, ${summary.baselines} baselines · TypeScript ${tsVersion}\n` +
    `library ${summary.libChars} chars / ${summary.libLines} lines   ` +
    `control ${summary.ctlChars} chars / ${summary.ctlLines} lines   ` +
    `median ${summary.medianRatio?.toFixed(2) ?? "n/a"}×\n\n` +
    `${pad("case", 34)}${num("lib", 6)}${num("ctl", 6)}${num("ratio", 10)}   flags\n`,
);

for (const c of [...mistakes].sort((a, b) => {
  const r = (x) => (x.ctl.chars === 0 ? Infinity : x.lib.chars / x.ctl.chars);
  return r(b) - r(a);
})) {
  const ratio =
    c.lib.count === 0 ? "ctl only" : c.ctl.count === 0 ? "lib only" : (c.lib.chars / c.ctl.chars).toFixed(1) + "×";
  const flags = [
    c.lib.overload && "overload",
    c.lib.truncated && "truncated",
    c.lib.sumExpansions && `Pick×${c.lib.sumExpansions}`,
    ...c.lib.leaks,
  ].filter(Boolean);
  process.stdout.write(
    `${pad(c.slug, 34)}${num(c.lib.chars, 6)}${num(c.ctl.chars, 6)}${num(ratio, 10)}   ${flags.join(" ")}\n`,
  );
}

if (summary.anomalies.length) {
  process.stdout.write(`\n${summary.anomalies.length} anomalies\n`);
  for (const c of summary.anomalies) process.stdout.write(`  ${pad(c.slug, 32)}${c.anomaly}\n`);
}

process.stdout.write(`\nnode survey/run.mjs <slug> to read a case's diagnostics in full\n`);
