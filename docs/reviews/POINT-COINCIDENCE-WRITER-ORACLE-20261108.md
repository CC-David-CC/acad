# Separate whole-driver writer-contract correction and hint audit

No tests, probes, build, type/syntax check or browser run. R1–R3 original driver
snapshots/receipts remain frozen unchanged in their historical evidence. This is
a separately approved assertion correction AFTER product writer-row repair
2e07230, not an equation/geometry/domain/source/currentness relaxation.

The old driver asserted`assert.deepEqual(row.constants,{})` for each new
PCoincident. The genuine AlgNumConstraint zero-constant constructor leaves the
optional field undefined; real native JSON serialization omits it. Requiring a
new empty object invented a storage field that the native writer does not emit.

Exact assertion change:

- Old:`assert.deepEqual(row.constants,{})`.
- New:`noAuthoredConstants(row)` accepts an ABSENT property, otherwise requires
  an enumerable own DATA descriptor whose value is a non-null non-array plain
  record, with exactly zero own keys. Null, false, arrays, own undefined,
  inherited-only constant values and nonempty records are not accepted.

The row is parsed from genuine captured native JSON in the Node driver, not
borrowed from an iframe; plain-record equality in this helper therefore operates
on locally decoded data. IDs, stage/index, ordered row references, actual
accepted/redundant status, all other source fields, original equations, geometry,
Native output, rejection atomicity, travel, .cad cycles and existing tolerances
are unchanged. The independent Python archive/equation oracle already uses
absence-as-no-constants and remains BYTE UNCHANGED.

## Source audit: actual hints are already derived before warm serialization

`parametric.ts:finishTransaction` clears PM's transaction flag, calls EVERY
owned`stage.algNumSystem.finishTransaction(true)` then invokes the supplied
validator. `AlgNumSystem.finishTransaction` calls`rebuildAdmission`.
Both successful paths in that method—the clean fast-path return and normal
ordered-admission completion—call`recordAdmissionHints` after actual solve
success. That method assigns each authored hint from the actual owned
`redundant`/`conflicting` sets (and removes hints from internal rows).

Only after this returns does coincidence serialize the warm workspace. IO's
`_serializeSketch` iterates those actual owned noninternal constraints and calls
`sc.write()`, which includes the current derived hint. Thus the newly admitted
constraint has a real hint before `freshClassifications(candidate,warm...)`.
No parallel flag, invented saved state, fallback classification or relaxed
checking is added. The subsequent genuine cold admission/captured-equation and
second original-request Worker proofs remain mandatory.
