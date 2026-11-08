# Actual R1 removal proof constant lifecycle

Root's complete public run on Core81d62ab/Desktop95d8023b reached the late
remove operation after a genuine `.cad` Save/fresh Open and named parameter
reedit2, then refused uncommitted with PROJECTED_DISTANCE_FAILED and an undefined
`distance` access. Earlier successful rows are retained by root; this note does
not turn that partial run into a qualified workflow.

`captureConnectedGeometryScope` invokes its selector inside the fresh
`IO.evaluateCapturedSketch` decoder transaction BEFORE the helper's later
all-constraint constant-resolution pass. `AlgNumConstraint` constructors
explicitly initialize `resolvedConstants` to undefined. The removal selector
collected the ACTUAL original ProjectedDistance equation too early; its schema
collects using `{distance}` and therefore failed. The edit selector resolved its
new proposed constraint and did not have this exact omission.

The narrow repair resolves the actual selected original constraint using
`c.resolveConstants(pm.constantResolver)`, then validates its original registered
domain/equation at unchanged captured geometry, before either edit or removal
selection collects equations. The real resolver remains authoritative for the
raw typed name. No manual constant/cache, name-to-literal rewrite, optimizer,
mutable producer/admission, transaction start/finish, solve or retry occurs
inside the selector. The existing proposed edit constraint resolves its own
constant separately as before. The rest of scope construction/currentness,
original/candidate cold proof, source membership and final metadata remain.

Lifecycle audit of this finite selector: its schema/ordered actual object checks,
`projectedDirectionValid`, constraint construction/constant resolution,
`validateConstraintGeometry` and polynomial collection inspect current objects;
they do not invoke mutable `prepareSignedDistance`, `addConstraintGroup`, PM
transaction mutation, stage solving or optimizer/admission. The later genuine
mutable transaction belongs to its separate ordinary workspace, after the
captured-scope call returns. No shared IO/solver lifecycle guard is weakened.

Source-only repair. The complete driver, recipe, oracle, assertions and all
numerical policies remain unchanged. No execution, probes, tests, TSC, build
or browser run was performed for this patch; root owns the unchanged whole run.
