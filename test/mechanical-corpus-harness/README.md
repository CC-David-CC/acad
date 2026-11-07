# Mechanical corpus harness repair

Base: `e361f95249935aff2e8f77f16d402d4065a12222`.
Branch: `research/mechanical-corpus-harness-20261106`.
This lane changes tests/harnesses only. No solver, polynomial, admission, Craft,
worker or `fix-entity.test.mjs` source is changed. Hold for root review; no app
build, deployment or CAD gate closure is implied.

## Reproduced failures

The same 41 mechanical test modules produced **225/228 pass, 3 fail**, with zero
skips. The historical pre-Arc-addition run was 224/227. This lane preserves the
explicit Arc fixture and all 228 current cases.

| Original failing case | Cause | Corrected proof |
| --- | --- | --- |
| actual legacy reevaluate writer skips only clock-only storage without skipping refresh/reset | `new URL(sketcherBundle.ts, import.meta.url)` becomes a Babel-transformed asset. Regex/new Function copies its function body without the module-scoped `_objectSpread` helper. The real writer catches that ReferenceError, so the fake fixture never reaches its reset. | Compile the intact source writer/import closure as a bounded test-only ES module; use real nonvisual IO/PM/math, retain exact old bytes over repeated solves and count the actual writer refresh/reset. |
| legacy reevaluate persists real geometry/metadata changes and retains boundary provenance | Same missing helper prevents the write. Its fake Viewer never exercises model math. | A named `W=120` drives the actual rectangle and dependent side; retained authored `W`, fresh residuals, boundary/frame and actual write are checked. A separate explicitly injected field after real IO serialization proves metadata output is meaningful to the writer. |
| explicit group and real segment endpoints follow a single transform with polar equations | An old private probe requires a historical false admission. The current baseline correctly rejects that candidate already. | Preserve the identical contradictory geometry, prove exact rejection rollback, inspect fresh equations and unknown diagnostics, then accept the identical angle equation after removing Horizontal and verify every endpoint with independent sine/cosine. |

The original caught error is `ReferenceError: _objectSpread is not defined`.
The old rigid assertion fails with `true !== false` at "retain the observed false
admission as a regression". These are recorded as original observations, not
silenced with helpers, skipped cases or disabled assertions.

## Writer entry boundary

The isolated inline resource-query loader parses the **original** TypeScript
before Babel. It requires exactly one `reevaluateSketch` declaration and pins:

1. The exact Canvas creation statement (removed only in the nonvisual test).
2. The exact Viewer/IO/options constructor (replaced with the actual existing
   `HeadlessSketchWorkspace`, which owns the real IO and ParametricManager).
3. The actual `Generator.resetIDGenerator()` call (retained, observed afterwards).

The rest of the writer AST is preserved. A structural test reconstructs the
presentation boundary and compares every remaining AST node with the original.
New unimported lexical dependencies fail entry generation. Four negative source
controls reject a changed Canvas tag, Viewer options, reset argument or unbound
function dependency. The full generated ES module is processed by Babel, so its
helpers retain lexical scope. No global helper shim or fake DOM/Canvas/solver is
introduced. Loading is inline in the test import; ordinary mechanical configs
need no special global loader registration, and the public app never imports it.

Observers delegate the real IO load, PM refresh and serialization. Real IO itself
refreshes once during load, so tests distinguish that refresh from the one
explicit writer refresh rather than assuming the old fake Viewer behavior.
Metadata injection is deliberately after a real serialization; it is a writer
output control, not a general arbitrary-metadata hydration feature claim.

## Rigid probe evidence

With a local first edge of length 100, a 60-degree rigid pose requires a Y
separation of `100*sin(pi/3)`, while retained Horizontal requires zero. Those
requirements are independently incompatible. On refusal, transform, endpoints
and polar parameters remain byte-identical. Fresh retained polynomial residuals
are zero or about 1.2e-11; the rejected angle equation has residual pi/3. The
candidate is rejected and is not redundant. DOF/fully-constrained diagnostics
remain `null`; rejection is not presented as a rank certificate.

Removing Horizontal permits the same angle equation. Its actual accepted
geometry is checked directly from the local points and group transform using
sine/cosine, independently of `mapRigidPoints`. A real temporary pose constraint
resets the model for the existing transactional refusal and anchored-rotation
controls; manual endpoint restoration is removed. Existing native preflight,
save/restore-shaped ownership and exact transaction rollback assertions remain.

## Validation

- Baseline broad corpus: **225/228**, three observed failures, zero skips.
- Corrected broad corpus: **228/228**, same 41 modules, zero skips/cancellations.
- Focused writer + rigid bundle: **13/13**.
- AST boundary/dependency controls: **5/5**.

All model math is imported from the actual source and bundled with the existing
Node mechanical test configuration. No AI provider, browser UI, Worker lifecycle,
BRep kernel or mounted desktop qualification is claimed here. The existing Arc
and fixation test source is byte-identical to the pinned base. See `receipt.json`
and `pins.json`; complete original and corrected logs are retained with the
private evidence checkpoint.

From a checkout with the existing dependency lock installed and supported Node:

```sh
CODI_EMBED_NUMERIC=1 node node_modules/webpack/bin/webpack.js --config test/mechanical-corpus-harness/webpack.broad.cjs
node --test .build/mechanical-corpus-harness/broad/test.cjs
CODI_EMBED_NUMERIC=1 node node_modules/webpack/bin/webpack.js --config test/mechanical-corpus-harness/webpack.focused.cjs
node --test .build/mechanical-corpus-harness/focused/test.cjs
node --test test/mechanical-corpus-harness/loader-contract.test.cjs
```
