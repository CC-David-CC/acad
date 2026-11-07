# Line relation candidate

`Collinear` puts both endpoints of the second nonzero segment on the infinite
supporting line of the first nonzero segment. The segments need not overlap.
`AxisSymmetry` reflects two distinct point objects across an independent
nonzero segment's infinite supporting line: their midpoint lies on the axis
and their displacement is perpendicular to it. The points may coincide on
the axis. Neither relationship depends on segment direction or the sign of
its internal polar length. This is distinct from the existing midpoint
`Symmetry` relationship.

The solver equations use unit line direction and length-unit residuals. The
same bounded last-valid direction guard used by projected distance checks all
required live segments before and after solving. An exact duplicate returns
`redundant` without appending a history entry; an inconsistent admission
rolls back the whole transaction. The guard limits remain scoped to sketches
containing live-direction relationships (6,000 stage objects/constraints,
32,768 unique parameters, 65,536 parameter visits). Exceeding them is not a
general Files or sketch size limit but can prevent further edits in such a
stage until it fits again.

Interactive solves involving Collinear or AxisSymmetry use the precise solve
before enforcing endpoint/polar consistency. The prior rough-only path restored
the axis even for an ordinary nondegenerate drag. This preserves the domain
check but may cost more on the UI thread; ProjectedDistance alone retains its
previous rough-solve path. Interactive latency and worker
offload remain open and should not be inferred from the bounded snapshot test.

The existing admission solver does not rank-classify all two-equation implied
relations: a satisfied symmetry whose inputs are all fixed can be reported as
`accepted`. The explicit duplicate check is narrower than a general
redundancy/degree-of-freedom analysis; no such general claim is made here.

The ID interface shares `createSketchRevisionGuard` and preserves all sketch
types; it still performs bounded strict serialization on the UI thread. The
epoch is supplementary, not a proven complete mutation inventory or a
replacement for exact serialization. Worker-first revision performance and
direct raw mutable internal writes remain open.

At source `864b567f3`, a local Chromium session against an R730-built app and
matched isolated sketch/project workers passed both selected global actions,
undo/redo, exact fresh native-workspace snapshot replay, current-ID submission
and hidden-parameter ABA refusal. Conflicting fixed UI relations preserved the
prior sketch/history. An injected admission plus stage rollback failure set
the shared recovery checkpoint, refused inspection and restored the sketch via
the existing recovery path. Selection/setup used the test helper; the drag
controls used real mouse input. For Collinear, AxisSymmetry and existing
ProjectedDistance, the selected endpoint actually moved and the final segment
was nonzero with consistent endpoint/polar values and finite relation
residuals. A prior AxisSymmetry rough-solve build restored even a nondegenerate
10 px drag; the precise-solve fallback corrected it. The existing projected
relation retains its previous rough path and also passed the separate root
control on the combined baseline. No physical phone, signed Files or general
latency claim follows from these tests.

The local real Chromium sketch Worker separately passed both relations using
independent line/midpoint/dot-product checks and refused duplicated and
degenerate targets. The R730 full-app build used private output paths and a
test-only webpack wrapper to bind a freshly built private project validator;
it did not modify the shared dependency cache. SHA-256 pins: app index
`163f3bb5b3b5d3c72dad451dbf40f6e6e40491866d99364112fa7e15b5b30cf2`,
sketcher `e4e7a314176c28d678654592b9d5c4af0cd42d4515abeaa94c14c7134555aa4f`,
helper `464d694ce99db45b4c8e77c370f044512d4f57f208836ceb166c135e4f7f95cc`,
sketch Worker `10d7b87a238b6bd5ab840d14d33110c0b5dd7db1ea70de1a93e509b8baf34771`,
project validator `d113c7c8933f937c07facc242f2aae199237fe6e4f1bc902dc801f2e74e47189`.
