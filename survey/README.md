# Diagnostic survey

What the compiler says when you misuse this library, next to what it says about the same mistake
made without it. Each case is a **pair**: `<nn>-<slug>.lib.ts` uses ts-sumtype, `<nn>-<slug>.ctl.ts`
does the same thing the same wrong way with a hand-rolled discriminated union. The control is the
bar: plain TypeScript already says *something* about most mistakes, and that is what the library
has to beat.

```sh
node survey/run.mjs                  # the table
node survey/run.mjs match-extra-arm  # one case's diagnostics in full
npm run test:diagnostics             # fail if anything moved (this is --check)
node survey/run.mjs --bless          # record the current diagnostics as the new baseline
```

Add `--no-build` to any of them to reuse the `dist` already there.

Cases compile against the built `dist/*.d.ts`, not `src/`, since the point is what a consumer sees.
`survey/` is outside both tsconfigs, so the deliberately-broken files can't affect `npm run check`.

## The baseline

`baseline.json` records each case's error codes, message size, elaboration depth, and whether the
message drags internal type names into view. `npm run test:diagnostics` fails when any of that
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

A pair that doesn't behave as declared (a `mistake` the library accepts, a `baseline` that
errors, a case only one side rejects) is reported as an **anomaly** rather than failing the run.
Those are the interesting results, not bugs in the harness.
