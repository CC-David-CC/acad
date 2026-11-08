# Shared native sketch Mirror implementation packet

Source-only from4ecf9a9; no tests/probes/TSC/build/browser or measured PASS.
Preserves qualified Slot/cubic/Ellipse source/evidence. No global solver,
tolerance, sourceFrame, PM lifecycle, Files, codec, Native kernel or UI changes.

Use the existing actual MirrorGeneratorSchema/SketchGenerator/SolveStage model.
Native copy(id?) on Point,Segment,Circle,Arc supports private captured output
IDs without post-construction ID reassignment. Actual constructors produce
their own descendants. Default existing copy calls remain compatible.
Circle.copy now passes numerical cx/cy/r instead of an EndPoint as cx; no
claim the old immediate Mirror path returned an observed invalid final circle.
New generated roles follow source roles; existing stored roles are carried
unchanged by regeneration, with no migration. Base abstract copy signature
only admits the optional argument; unsupported subclasses still throw.

Native Mirror keeps source parametric direction for Segment/Point/Circle,
and swaps reflected Arc endpoints to retain actual CCW. No shortest-arc
inference. Near/full Arc encoding and unequal-endpoint-radius representations
are outside new qualification, reported unsupported instead of mathematical
invalidity. Native reader carry for those and ellipse/cubic/group domains
remains, without new support/capability or silent healing. Public independent
source selection excludes generated roots, child handles and semantic Slot/
RigidGroup members. It can mirror a source already used by another generator;
there is no shape deduplication when loci intersect/coincide.

New Worker mirrorTransition captures full original source/bindings plus the
ordered actual source/axis IDs and private generated IDs. Complete original
solve/captured proof precedes generation. A real detached native stage and
generator generate actual output objects. Removing ONLY their actual root
rows and the appended real generator record must restore retained source
exactly. Fresh complete solve/captured equations/cold verification prove the
candidate; a separate disposable Worker reconstructs the WHOLE original
request and exact output identities/bytes. No optimizer output copyback,
arbitrary matrix authority or fabricated success. One existing source-byte
journal transaction, same lifetime/cancel/currentness/commit semantics.
Axis/source edits use current shared point/dimension operations and actual
SolveStage regeneration. capturedGeometryScope already authenticates actual
generator dependencies; no replacement graph/policy was added.

New inspection exposes mirror.sources/axes/generators. Actual native axis
endpoint IDs/ordered input/output points, Circle/Arc radii and Arc angle Params
come from real instances/Param/SolverParam custody in a disposable Worker.
Source projection observations bind all actual native IDs; Main validates
small bounded records and mappings, never performs mirror geometry/solving.
Generated targets remain readonly. Source-only domain inventory is not a
BRep or arbitrary-curve certificate. Existing unsupported domains stay
explicit in derived inspection reasons, never persisted flags.

## Native Open read-only proof and preservation

projectValidationCore adds one Worker-only helper after existing strict
project/constraint/reference/entity/spline/constants preflight. Non-Mirror
documents bypass it. No PM adoption/storage/restore owner code changed.
The helper uses a PRIVATE geometry-only native factory projection: same
object geometry/IDs, actual stage/generator records; authored constraints,
dimensions and labels omitted ONLY from that disposable geometry reader.
It is never solved, returned as model source, published, saved, or claimed to
verify constraint satisfiability. Original source/equations/typed bindings
stay authoritative and unchanged. Original raw constraint references, resolved
against actual native ownership, still reject same-stage generated consumers.
Legacy absent stage derives from actual restored native ownership; any explicit
wrong supported-generator stage/ordered binding refuses, no source rewriting.

Supported primitive Mirror graph requires actual native classes/roots,
index/child/Param membership, actual producer pointer, one-to-one pairs,
nonzero axis, source-stage/order/dependency guards and valid Arc encoding.
Actual native regenerate operates detached copies in saved order. Original
authored/unsupported input writes must remain exact, output identity and Param
sets retained. Generated stored coords compare with actual regeneration using
the existing50pm coordinate budget, scalar radius1e-9; cache mismatch is
MIRROR_DERIVED_MISMATCH, not healed. Unsupported curve/group/encoding carry
returns a derived unsupported reason, not INVALID_GEOMETRY or a support upgrade.
Unsupported producer descendants cannot acquire support from a primitive
downstream node. Typed constraints need not be resolved in this geometric
reader, because it does not run them; complete public mutations still do.

Existing source/response envelopes remain; new shared lists cap256sources/
generators and32stages through actual established graph domains,100000owned
work bound,1MiB transition source, bounded inspection transport. Limits yield
resource refusal, never invalid geometry. The new Point stage-policy case
reuses actual reflected coordinate checks; no new generator state/version.
Legacy headless Arc/source bounds are unchanged. Full future ellipse/cubic/
semantic group Mirror remains unfinished, not silently flattened.

Complete public driver/oracle under test/mirror-public-workflow covers real
authoring/regeneration/travel/refusal/native Save/Open and exact source custody.
Independent Fraction reflection and high-precision actual CCW Arc-locus
evaluation fix50pm before observations. No execution in this packet.

Common composition: closedSketchTransitions gains only additive Mirror import/inspection/method/task branches; craftBundle adds ONE optional createClosedSketchMirror interface method. Existing factory Object.assign registration already exposes it. Desktop existing registerClosedSketchCommands owns the new command, so NO index/menu/toolbar splice is required. Root should serially merge Radius task/target routes and current principal-source/Apply changes; this packet does not replace those families or rebase their work.
