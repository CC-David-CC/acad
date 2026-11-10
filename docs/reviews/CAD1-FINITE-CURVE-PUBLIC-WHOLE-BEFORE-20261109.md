# Public finite query → endpoint edit: BEFORE API/whole packet

SOURCE PLAN ONLY; no implemented-command claim, seeds, product/common changes,
parser/import/tests/build/Native/browser execution. Isolated base
`e91d24056547628a37a2fd4d339aadcbf5ff7b3c`; source census additionally read
Root3160501 and Host4d555e1, revised for explicit Arc approval
`8fda31f614244fd829a73594f5c102e6c8e46860`. Root must choose/freeze this API BEFORE code.
Packets3/5, current-source orchestration, actual backend activation and mutation
verification must all compose; mathematical/raw replies alone confer no authority.

## Concrete existing reuse, without invented availability

|Existing actual command/source|Use in the future whole|
|---|---|
|inspect-sketch-creation / create-empty-sketch-plane|Genuine XY plane at depth0; actual returned faceId, never source JSON.|
|inspect-closed-sketches / inspect-closed-sketch|Current revision, actual roots/child parent IDs, stage and existing constraints.|
|append-sketch-primitive|Literal Segment a/b; Circle c/r; after the approved Arc packet, mandatory Arc a/b/c/branch with branch proper-ccw or full-ccw; role null or construction, stage0..31. CAD assigns IDs.|
|edit-closed-sketch-point(s)|Ordinary edits that revoke query tickets; actual inspected children, not parsed ID suffixes.|
|apply-closed-sketch-coincidence, apply/remove-closed-sketch-fix-entity|Genuine connected-neighbor positive and constrained refusal.|
|apply-closed-sketch-radius; edit-closed-sketch-dimension; apply-physical-bindings|Actual RadiusLength/name binding, mm(...) definitions and later stale-parameter case; no literal erasure.|
|inspect/create rectangle; inspect-selected-profiles/regions; create-selected-extrusion|Real unrelated prism and later trimmed generic polygon consumption.|
|inspect-authored-edits / travel-authored-edit|Actual sketch-bytes J and exact source travel, not a new operation graph.|
|save / open-project, existing signed harness/freshOpen/Files sync|Normal .cad lifecycle and submitted-write custody.|

Every authored Arc record in this packet has exact data keys ['a','b','c','branch']
with explicit proper-ccw/full-ccw. Defaulting during new intent capture is not
used to hide a missing saved branch; raw-query consumers must compose that
source distinction without claiming an unreviewed Native wire change.

Actual shared implementation seams: `closedSketchTransitions.ts:captureJob`,
`applyTransition`, `job.prepare`, `submitPreparedReplay`; headless
`coordinateTransition.ts`, `coordinateTravel.ts`, captured geometry scope and
original/cold/captured verification; one existing sketch-bytes J event. Proposed
semantic edit calls the shared private producer, never the public coordinate
command with coordinates supplied by the caller. Typed access must use genuine
existing coordinate/name policy, not a public bypass flag.

Current owner limits remain real: full tip, genuine supported plane/known source
association, empty source boundary, current typed resolver and genuine host.
Positive consumed-source case below requires authentic current constructor/source
ownership. If that is not yet issueable, the integrator must report/repair that
specific seam; substituting an unrelated-source positive does not close it.

## Exact proposed public DTOs (all fields required; no extras)

1. NEW `inspect-closed-sketch-query-capabilities({})` returns
`{version:1,ready,reason,revision,unit:'millimeter',candidates,engines,limits}`.
Candidate rows `{faceId,eligibility:'needs-worker-verification'}` reuse actual
closed-sketch provenance discovery, not Main geometry or a success assertion.
Engine rows `{engine:'occ',engineRevision,rawSupportVersion:1,certificateVersion:1,
scope:'source-query-only'}` list only actually admitted loaded factories/graphs;
none if unavailable. Limits expose2 curves/8 raw rows/2 isolated events/5 overlap
records/64KiB response, not a promise every original Arc is supported. Existing
64-source/1MiB source/1024-parameter caps remain. Arc proper/full availability must
be advertised separately according to the actual composed query consumers;
source enum support alone does not advertise full-Arc raw queries. This new
read is not implemented.

2. Proposed `inspect-closed-sketch-intersections` request:
`{revision,faceId,engine:'occ',engineRevision,curveIds:[idA,idB],domain}`.
IDs are distinct actual inspected roots. Domain is exactly `{kind:'finite-pair'}`
or `{kind:'endpoint-ray',targetCurveId,endpoint:'a'|'b'}`. The ray target MUST be
one selected actual Segment. Boundary stays finite; no supplied bounds/angles/
stage/coordinates/frame/raw JSON/hash/certificate/positive flags.

Response exact envelope:
`{version:1,revision,faceId,unit:'millimeter',engine,engineRevision,curveIds,domain,
status,reason,queryId,support,events,overlaps}`. Returned curveIds use packet3's
canonical code-unit order. status is certified/uncertain/unsupported. reason is
null for certified, otherwise `{layer,code,message}` from a finite actual source/
capability/certificate policy; no message-to-code inference. Uncertain/unsupported
has queryId:null, support:null, events:[], overlaps:[]; terminal invocation or
cleanup failures throw with their original layer/code/cause instead.

For certified results support is `{kind,rootCount}` with0/1/2/continuum, not the
raw IsEmpty flag. Every finite isolated event row is
`{eventId,point:[x,y],multiplicity:1|2,occurrences,errorSquaredUpper,withinBudget}`.
Occurrences are `{curveId,location}` (interior/endpoint-a/endpoint-b/periodic/
outside), owner-mapped explicitly. Outside is legitimate for the target of an
explicit endpoint-ray; domain selection is not finite-Segment membership.
point is the ACTUAL Native candidate in sketch mm;
errorSquaredUpper is the existing exact hex rational witness in mm². eventId is
opaque only when distance/source/job checks allow selection, otherwise null.
withinBudget alone is not edit permission. queryId is nonnull only when there
is a genuinely issued selectable event; empty/nonactionable/overlap results do
not retain a ticket. All roots outside either selected
domain remain accounted for privately by the complete proof. Certified empty
has no events; common-support overlaps use packet5's exact interval/contact
records and symbolic seam/owned endpoints, with NO isolated event IDs. First
edit slice refuses continuum/boundary-selection edits rather than inventing a
cut point; explicit interval editing remains required later.

3. NEW `edit-closed-sketch-endpoint` request:
`{revision,faceId,action:'trim'|'extend',target:{curveId,endpoint:'a'|'b'},queryId,eventId}`.
No point, parameter, engine override, proof or source bytes may be submitted.
For trim require finite-pair, an actual Segment in that pair and0<t<1; moving a
retains[p,b], moving b retains[a,p]. Exact selected own-end contact is a no-op
retaining original bytes; selecting the opposite end would collapse and refuses.
For extend require the SAME endpoint-ray target/endpoint: t<0 for a, t>1 for b.
All forward roots are offered; only explicit eventId chooses one, never nearest.

Return `{changed,revision,faceId,action,target,point:{id,x,y},persistence:
'volatile-workspace',authoredUndo,manufacturingAssignments}`. target echoes the
curve/endpoint; point.id is the actual owned child. Existing changed/no-op J,
revision and review-if-present settlement semantics remain. The unchanged target
end and selected boundary curve must remain exact. Other genuinely connected
geometry may follow RETAINED equations through the existing authenticated scope
and independently reconstructed original operation; it is not called unrelated.
All nongeometry fields, raw names/formulas, IDs, stages/roles and truly unrelated
geometry remain exact. Preflight actual travel support before publication so a
success cannot create an untravelable pair; retain current1..32 handle bound.

Proposed narrow new edit refusals: STALE_CURVE_QUERY, CURVE_QUERY_SELECTION_MISMATCH,
CURVE_QUERY_DOMAIN_MISMATCH, CURVE_ENDPOINT_DEGENERATE and
CURVE_PUBLICATION_DISTANCE_UNQUALIFIED. Preserve actual Worker codes/causes such
as COORDINATE_CONFLICT, COORDINATE_NOT_REACHED and originating/downstream Native
failures. Cancellation stays AbortError; postpublication errors remain committed.
Do not label generic nonconvergence an exact contradiction or invent solver codes.

## Event lifetime: settle the mount before retaining selection

Actual discard-only Native owner MUST close successfully before query success.
An edit cannot depend on a live Native handle/owner. Propose ONE bounded pending
selection receipt per Craft/document, containing private genuine source/job/
parameter/frame/namespace-version/J/lifetime anchors and acknowledged prepared/
raw/certified receipts (≤2×16KiB preparation +64KiB raw +64KiB certificate, plus
one existing bounded original-source string reference; no new model/cache graph).
Opaque query/event IDs only select this privately issued receipt, never decode
geometry. It contains no live Worker, mount, Params, DB name or persisted witness.

New query replaces it. Revoke on attempted mutation ENTERING the actual shared
transaction, or on actual abort/disposal, ordinary source/parameter edit,
Undo/Redo, namespace/Open/new document or any captured revision/J/lifetime anchor
change. A refused pure preflight with no source/job/owner change does not consume
the ticket: retain it only after positively checking EVERY original revision,
namespace/version, J, parameter, generation, host and service/owner anchor is
still current and all preflight resources are acknowledged settled. Exact no-op
before any mutable transaction can likewise retain it under those predicates.
Do not infer retention merely from committed:false, unchanged coordinates or a
familiar error code; a failed candidate can legitimately invalidate epoch/tokens.
Undo restoring the SAME bytes does not restore an old ticket. Readonly ordinary
inspection does not invalidate it. Edit redoes both original-request source and
certificate proofs under its actual current job before one source/J/full-suffix
publication. Only the private producer supplies the retained actual Native packet;
a public raw reply/copied JSON/boolean can never issue it. No requery/fallback is
used to choose another root. This pending-selection policy needs explicit Root
approval; the pure mathematical result remains nonauthoritative.

Proposed bounded machine failure metadata is failureLayer
(request/preflight/source/mutation/publication/settlement) plus
selectionDisposition (retained/revoked/unavailable), scoped to the submitted
query ID. Actual private phase/currentness/settlement evidence determines it,
never a caller flag or code/message classification. A known pure request/domain/
degeneracy/fixed-scope preflight refusal may say retained only with the exact
predicate above; the SAME COORDINATE_CONFLICT reached after transaction entry
must say revoked. Unknown/not-issued IDs say unavailable and do not revoke a
different valid current receipt. Actual source/job/owner change, abort, transaction
entry or unknown invocation/cleanup/write outcome revokes; no ticket facts are
retained after uncertainty. Preserve original code/cause and truthful committed
settlement independently. Root must approve the strict Host transport for this
metadata; no such response field is claimed implemented here.
Actual phase tracking belongs at the trusted shared mutation-entry seam after
pure preflight; it cannot be reconstructed from an error's public properties.
Readonly cold proof work does not by itself mean requested mutation occurred.

## Bounded case roster: actual public authoring, independent truth

Use fresh existing plane commands and append each pair, retaining assigned IDs.
Translate separate pairs if helpful; no recipe grouping or source-array order
becomes authority. Reversed request pairs get fresh IDs; compare geometry/owners,
never opaque ID equality. Each read checks exact full accepted source/J/material/
counter/host/revision state and settled resource ownership before/after.

|Case|Actual finite inputs / exact independent expectation|
|---|---|
|S/S cross + reverse|(-5,0)→(5,0), (0,-5)→(0,5): one(0,0), t=u=1/2.|
|S/S endpoint|First above, second(5,0)→(8,3): one(5,0), genuine first-b/second-a.|
|Finite exclusion|(0,0)→(1,0), (2,-1)→(2,1): support root(2,0), certified finite empty.|
|Parallel|Two x-directed Segments at y0/y1: exact separated supports, empty.|
|Collinear overlap/contact|(0,0)→(4,0) vs(2,0)→(6,0): [2,4] with source owners; separate0..2 vs2..4 gives singleton contact. No isolated edit ID.|
|S/C + reverse|Circle c0,r5; Segment(-6,3)→(6,3): two(±4,3), full census.|
|True tangent/empty|Same Circle, horizontal y5 gives(0,5), multiplicity2; y6 gives none.|
|C/C + reverse|Radius5 centers(0,0),(6,0): (3,±4), no root merging.|
|True circle tangent|Same radii, center distance10: one(5,0), multiplicity2.|
|Circle10±1e-6|Exact represented distance test gives2/0 respectively. Complete certified proof OR explicit bounded uncertainty, never tangent/false empty. This row tests honest conditioning, not near-contact authoring closure.|
|Coincident/nested/disjoint|Identical circles: full overlap; concentric r5/r3: empty; centers20 apart/r5: empty.|
|Quarter/major|Explicit branch proper-ccw, c0,r5, a(5,0),b(0,5), and reversed endpoints CCW-major; line y3 gives only(4,3)/(−4,3), while both support roots remain proved.|
|Arc seam|Explicit proper-ccw, a(3,-4),b(3,4),c0; vertical x4 gives both(4,±3) inside CCW sector crossing canonical seam.|
|Coincident Arc domains|Quarter and complementary major on same circle: two owned endpoint contacts; Circle+quarter: complete quarter interval. No fabricated numeric root.|
|Guaranteed numeric uncertainty|S1(0,0)→(1,0), S2(0,2^-54)→(1,2^-53): exact determinant2^-54≠0, while actual OCCT epsilon branch reports identical/0 roots. Require NATIVE_ROOT_CENSUS uncertainty and no IDs.|
|Explicit tiny proper|After Arc packet composition, mandatory branch proper-ccw with a(1e-7,0),b(0,1e-7),c0; x-axis Segment(-2e-7,0)→(2e-7,0) has two support roots and ONLY positive endpoint(1e-7,0) in the proper quarter. Do not freeze the inherited1e-6 refusal/full interpretation as correct future behavior.|
|Explicit full/invalid zero|Full-ccw requires exact genuine seam equality and stays Arc; proper-ccw with collapsed a=b refuses BEFORE publication. Full-Arc query remains precisely unsupported until genuine full-branch raw/query binding composes; no Circle promotion. Its required positive query coverage stays open.|
|Actual source uncertainty|An ACTUALLY admitted explicit proper Arc failing the strong exact-radius/representable-domain gate returns FINITE_CURVE_SOURCE_UNCERTAIN; no injected source or inherited proximity classification is used to force this case. Report any missing real authoring route rather than fabricate one.|
|Finite vs ray|Target(0,0)→(2,0), Circle c(5,0),r1: finite pair empty; b-ray gives BOTH(4,0),(6,0). Explicitly choose6, resulting length6. Undo/requery/explicitly choose4, length4.|
|No-op/collapse|Trim own selected endpoint: exact no-op/no J; opposite endpoint: CURVE_ENDPOINT_DEGENERATE, all accepted state exact. Prove ticket remains usable only when this was pure preflight with every original anchor unchanged.|
|Constraint refusal|Public Fix target Segment, THEN fresh query/interior trim: COORDINATE_CONFLICT from actual shared fixed scope; retain real cause, all accepted state exact. Retention/revocation follows actual phase/anchors, not this code alone.|
|Stale/foreign-own|Ticket after ordinary point/parameter edit, after Undo restoring bytes, and after fresh Open must refuse. Use a curve from another OWN sketch to prove wrong-face refusal; no account/security probe.|

## One complete author/edit/travel/native lifecycle

1. Normal New. Public rectangle(-80,-40),10×6, selected extrusion depth4 in
   an actual admitted body cohort: volume240, bounds[-80,-40,0]..[-70,-34,4],
   actual Native inside/boundary/outside points. Create a SEPARATE empty query
   plane plus unrelated Point(7,9). Query raw-support cohort is explicit and
   source-query-only; it does not convert/switch the part's Native history.
   Actual discovered runtime capabilities are prerequisites, never guessed pairs.
2. Author/read the bounded roster; EVERY newly authored Arc explicitly supplies
   branch proper-ccw/full-ccw as intended. Missing/unknown saved branches refuse
   before adoption under the approved Arc contract, not an old-format migration.
   Trim a free Segment against chosen boundary;
   immediate shared Undo/Redo restores exact bytes/IDs/constants/branches. Run
   ray4/6 choices, no-op/constraint/stale controls; never infer closest intent.
3. Required real profile chain on another genuine plane: four Segments
   (20,0)→(24,0)→(24,3)→(19,3), plus(20,3)→(20,0). Current selected source
   partition rejects this self-contacting open chain with OPEN_OR_AMBIGUOUS_PROFILE;
   it is NOT claimed geometrically to contain no planar cell. Query top vs left,
   trim top-b to(20,3), travel. Publicly add the four actual endpoint PCoincident
   rows without moving geometry, plus construction Segment(22,-1)→(22,5).
   Then actual region discovery/extrusion depth2 gives area12/volume24.
   AFTER consumption that construction boundary supports top-b trim to(22,3),
   with truly connected left-a following. Existing V3 polygon replay must give
   trapezoid area9/volume18. Selected boundary and other target end stay exact;
   actual IDs/region membership preserved. Immediate Undo/Redo and downstream
   invalid-profile refusal must retain the last valid body/source/J. This is
   required consumed-source positive, not replaceable by the unrelated prism.
4. Save A (.cad), browser/server exact equality, fresh signed Open1; requery new
   IDs/tickets, old selection refuses; normal source reedit and Save B/Open2.
5. Before typed mode author a real RadiusLength on an ordinary boundary Circle.
   Apply definitions `{name:'boundaryR',dimension:'length',expression:'mm(1)'}`,
   bind via actual discovered dimension locator; query/edit with full original
   typed coordinate policy. Change definition to mm(2), require old ticket stale,
   fresh analytic roots consistent with current radius, raw name/formula retained.
   Shared travel preserves actual typed intent; no numeric erasure or bypass.
6. Reedit after Open2, Save C/Open3, requery and reedit/resave normally. Existing
   Save/export write guards retain owned context on unknown settlement, no retry/
   forced close. Query failures produce no file; no malformed positive source.

AFTER-WHOLE independent checker binds exact producer/helper Git blobs, before/
after hashes, complete case/phase/write/travel roster, actual root owner/domain/
polynomial witnesses using Fraction, source+constraint intent and all .cad ZIP/
CRC/SHA/native source/definitions. Irrational roots need exact polynomial/interval
proof, not a binary64 expected point. Check actual Native volumes/bounds/points
for both genuine bodies and preservation of unrelated source; distinguish50pm
source fidelity from existing Native/reference/presentation budgets. No copied
raw success or validity flag substitutes for geometry. Actual optional exports
must use existing discovered exporters and their normal custody/oracles.

Remaining required variants stay explicit: middle trim/split, Circle→Arc, Arc
endpoint mutation, exact coincident-interval boundary edits, full/proper/tiny/
zero/near-full branch semantics, poorly conditioned cases outside the proven
domain and richer curves/profile consumers. This first shared slice does not
close those requirements or all Gate1. No recipe-only admission restriction is
proposed; the table exercises the general declared domains and honest limits.
