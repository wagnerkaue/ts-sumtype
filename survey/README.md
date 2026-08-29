# Diagnostic survey

What the compiler says when you misuse this library, next to what it says about the same mistake
made without it. Each case is a **pair**: `<nn>-<slug>.lib.ts` uses ts-sumtype, `<nn>-<slug>.ctl.ts`
does the same thing the same wrong way with a hand-rolled discriminated union. The control is the
bar: plain TypeScript already says *something* about most mistakes, and that is what the library
has to beat.

```sh
node survey/run.mjs                  # the table
node survey/run.mjs unwrap-non-sum   # one case's diagnostics in full
npm run test:diagnostics             # fail if anything moved (this is --check)
node survey/run.mjs --bless          # record the current diagnostics as the new baseline
```

Add `--no-build` to any of them to reuse the `dist` already there.

Cases compile against the built `dist/*.d.ts`, not `src/`, since the point is what a consumer sees.
`survey/` is outside both tsconfigs, so the deliberately-broken files can't affect `npm run check`.

## The baseline

`baseline.json` records each case's error codes, message size, elaboration depth, and whether the
message drags internal type names into view.

Size is a proxy, and a treacherous one: a message shrinks just as readily by dropping information
as by dropping noise. `Property 'value' does not exist on type '{ readonly tag: "some"; readonly
some: string; }'` names the key the author should have written; replacing that shape with a type
name saves characters and takes the answer away. Machinery is what should go, `Pick<...>` and
intersection spelling and internal aliases, never the shape itself. Read the message before
trusting the number. `npm run test:diagnostics` fails when any of that
moves, **including improvements**, since an unrecorded improvement is one nobody can point at in
review. Either direction: read the diff, run the case to see the messages, then `--bless`.

Wording is deliberately not asserted; it drifts with every TypeScript release. The check prints a
note when the baseline's TypeScript version differs from the running one, so that diff reads as
expected drift. It is not part of `npm run check`: it needs a built `dist` and would fail the
main gate on a compiler upgrade.

## Adding a case

Both files open with a header the runner parses:

```ts
// @case    result-read-without-narrowing
// @feature Result
// @kind    mistake
// @title   Payload read straight off a Result
// @intent  Use the success value without checking for the error case first.
// @note    (optional, per side) why it behaves this way
```

`@case` must match the filename slug. `@kind` is `mistake` (expected to error) or `baseline`
(expected to compile clean). `@intent` and `@title` should read the same on both halves;
`@feature` and `@note` are per side.

`@note` is where a diagnosis goes: which inference rule swallows the mistake, which constraint
produces the unhelpful message. Next to the code, so it can't drift away from the case.

The control is how you would write the task in vanilla TypeScript, and nothing else. Do not
reshape it to mirror the library's call structure: if the library routes a value through a
constructor or a helper where vanilla builds a literal in place, that difference is the thing
being measured. Object literal freshness is the clearest example. A fresh literal checked against
an annotation reports one short line, where the same value arriving from a function call reports
the whole assignability descent. When the library's shape forces the second path, the larger
message is its cost, not a flaw in the pair.

What both halves *must* share is the task and the mistake. A pair modelling different slips, or
solving different problems, measures nothing.

A pair that doesn't behave as declared (a `mistake` the library accepts, a `baseline` that
errors, a case only one side rejects) is reported as an **anomaly** rather than failing the run.
Those are the interesting results, not bugs in the harness.
