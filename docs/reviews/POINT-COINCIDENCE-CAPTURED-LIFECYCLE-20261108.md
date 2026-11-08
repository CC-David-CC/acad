# Confirmed captured-coordinate inspection lifecycle repair

Complete Coincidence R2 process39712, actual Coreeadac5e / Desktop8eac41c9e,
failed on its first apply with`Choose two distinct current nongenerated points.`
The preceding genuine rectangle Native observation and initial Point diagnostic
passed. Root retains R2. This is source-confirmed transaction lifecycle misuse,
not evidence that those actual point IDs/membership were invalid.

## Actual source cause

`captureConnectedGeometryScope` uses the existing Worker-only
`workspace.io.evaluateCapturedSketch` visitor. IO starts a private transaction,
decodes actual owned objects/constraints at captured coordinates, then invokes
the synchronous visitor. It deliberately never calls finishTransaction/optimizer;
its finally discards the workspace. The scope selector called
`preparePointCoincidence`, whose correct normal-mutation guard rejects
`pm.inTransaction`. That check necessarily rejects in this private visitor.

## Narrow coherent repair

Separate`inspectPointCoincidence(pm, objects)` from stateful preparation. Pure
inspection retains ALL existing actual EndPoint/ID/stage/finite/root-generator/
parameter-alias checks, unordered actual-row matching and ambiguity refusal. It
returns the existing actual PCoincident or a detached new actual-schema proposal
referencing the genuine owned point Params. PCoincident construction only gathers
those Params; no new coordinate values, rows, transaction or auxiliary factory
state are installed. Its real original polynomials can therefore be inspected
inside the captured visitor without optimizing or publishing.

`preparePointCoincidence` still refuses an active transaction, then calls the
same pure inspection and supplies the existing post-admission validator. Normal
human and mutable Worker callers KEEP that guard and their existing transaction
ownership. Only the captured scope selector calls pure inspection. There is no
caller-controlled skip flag, alternate public API, nested transaction, _add,
finishTransaction or successful-optimizer claim on this path. The original
captured ownership/equation proof still runs and checks geometry is unchanged.

Both unchanged-original-request Worker reconstructions, actual row order/status,
source/J/currentness, generator/alias guard, full suffix and atomic publication
remain unchanged. Driver, independent oracle, dataset, tolerance and previous
R1/R2 evidence are untouched. No tests/probes/build/type/syntax check/browser run
is performed here. Qualification requires root's unchanged complete whole run.
