# Indexed planar-patch certificate: source handoff

SOURCE ONLY / UNRUN / NOT QUALIFIED, 2026-11-09. New helper only; no Root
mesh/check/roster, frozen source, artifact, evidence, executable or production
file changes. No imports, parser, tests, build, Native/browser or actual helper
execution occurred in this lane.

Read Root mesh oracle/invoker at exact
`fe502d8d94d60ee0a28045aee171495336a9e37a`, PLANAR-INVOKER.md and independent
review `8f5e058e77e86a927dc603c8667d1ed08cef0929` before implementation. The
CGAL source contract remains `420ea4ef8a92ec1208aa2852e1e876ed29d760c1`; Root
owns the actual separately compiled executable/build custody. No guessed binary
hash, current-binary execution or source-only qualification is supplied here.

## API and configuration

    certify_planar_patches(vertices, triangles, labels, local_exact, frame, e,
                           cylinders, lo, hi, planar_config)

`planar_config` is a concrete exact five-field dict:

    {
        "executable": ABSOLUTE_REVIEWED_EXECUTABLE,
        "expected_executable_sha256": ACTUAL_REVIEWED_BINARY_SHA256,
        "cpp_source": ABSOLUTE_ACTUAL_CPP_SOURCE,
        "build_source": INVOKER_REVIEWED_FOUR_FIELD_BUILD_ANCHOR,
        "output_dir": NEW_ABSOLUTE_OWNED_PER_ARTIFACT_DIRECTORY
    }

The first four fields retain the existing invoker contract unchanged. Its build
anchor is `{commit, cppRelativePath, cppSha256, cgalVersion}`. The output directory
must not exist; its already-owned parent must exist. The helper creates it
exclusively, then one fresh deterministic `patch-NN-LABEL/` per attempted patch.
No report/domain retry or automatic fallback exists. Root supplies actual source
and complete CGAL mesh evidence independently; there is no caller valid flag.

The entire original vertex/triangle arrays, labels and exact local-coordinate
array are concrete bounded lists/tuples. Labels have exactly one entry for every
original triangle. Original IDs/order/coordinate bits are retained. Frame is
actual `{origin,x,y,z}` with right-handed signed-permutation integer axes. Each
supplied local coordinate must equal an independent exact rational transform of
the original world binary64 minus original frame origin. Rounded local floats
are not accepted as an equivalent representation.

`e` is Root's independently source-bound analytic expected intent: kind rectangle,
circle or annulus; width/height or outer/inner; optional actual ordered holes
`{u,v,radius,depth}`. `lo<hi` is the actual source-derived local axial interval.
Each submitted cylinder must equal the exact source-derived inventory, including
center/radius/sign/lower/upper/blind role. Blind lower bounds must equal exact
`Q(hi)-Q(depth)`, not a previously rounded subtraction. Internal analytic labels
`outer`, `inner`, `holeN` are derived from this inventory; no opaque Native or
authored feature ID grammar is parsed.

## Actual boundary and neighbor proof

Every original triangle enters an indexed edge-use census. Each global edge
must have exactly two opposite original uses. Same-label edges connect the actual
patch; different-label edges retain both actual triangle IDs and directed vertex
IDs. Each planar label must be one connected patch. Its complete directed boundary
must be disjoint simple indexed cycles, with exactly one outgoing and incoming
use per boundary vertex. No coordinate equality joins different IDs, and every
derived cycle must be consumed by exactly one expected outer/hole role.

| Planar patch | Projection / original sign | Required outer neighbors | Required hole neighbors |
| --- | --- | --- | --- |
| Rectangle top | local XY / + | four actual sides in oriented cyclic order | every through and blind wall |
| Rectangle bottom | local XY / - | same four actual sides, reversed | through walls only |
| Circle/annulus top | local XY / + | actual outer wall only | actual inner wall and all hole walls |
| Circle/annulus bottom | local XY / - | actual outer wall only | actual inner and through-hole walls |
| Blind floor | local XY / + | corresponding actual blind wall only | none |
| Rectangle X side | local YZ / outward X sign | top/bottom and actual Y-min/Y-max sides in oriented cyclic order | none |
| Rectangle Y side | local ZX / outward Y sign | top/bottom and actual X-min/X-max sides in oriented cyclic order | none |

Consecutive equal neighbor roles coalesce only for the cyclic role comparison;
all original indexed edge occurrences and owners remain in the proof. A role
cannot reappear as an extra run, a hole cannot use another wall, and duplicate,
missing, branched, disconnected or unexpected loops refuse. Side/cap roles are
authenticated from actual adjacent labeled triangles plus separately checked
source planes, never from a fitted rectangle/AABB or nearest geometry.

All planar original triangles independently pass exact plane incidence and exact
outward projected orientation before any invocation. Cyclic projections XY/YZ/ZX
make the checked cross-product component the projected area sign. Plane distance
is affine, so vertex extrema cover each entire original triangle. Exact finite
axial/rectangle ranges and circular outer-disk containment are also checked.
Each edge adjacent to a named wall independently checks actual rim endpoint
incidence and the entire chord's exact radial minimum, retaining current policy
`Q(1e-6)` incidence and `Q(.01)` deflection (the represented existing Python float
constants). These are artifact budgets, not a 50pm BRep certificate. Full cylinder
coverage and full-surface/source displacement proofs remain separate.

## Native call and evidence custody

All source-role, local-exact, plane, connectivity and loop checks finish before
the first child starts. Every planar patch receives exactly all original
triangle IDs with that label, in original order, plus explicit original indexed
outer/hole loops. The helper only uses the PRIMARY indexed mode, never source-
rectangle mode, never a fitted reference. The existing invoker performs the
actual EPECK union/sum-area/symmetric-difference proof and process settlement.

Require aggregate `status == "PASS"` AND `complete is True`, full expected/
attempted patch census, and independent remaining source/wall/global obligations.
Any nonPASS invocation stops further child creation. Full immutable returned
invocation metadata is copied into bounded JSON evidence, including any actual
unsettled process ownership. It must equal the actual recorded invocation file;
captured Native report bytes must equal the returned strict report and its
recorded byte count/SHA. No inner report PASS overrides an outer failure.

Fresh files are never removed/retried/overwritten. The aggregate exclusively
writes `patch-certificate.json`; return adds its actual path/byte count/SHA for
Root's outer ledger. Preflight raises before child startup; evidence IO failures
raise, preserving every existing child directory. A missing/partial aggregate
cannot qualify; Root must reconcile any retained process/custody record.

Evidence includes original F64-LE/QQQ-index raw-array SHA (same encoding as the
complete CGAL evidence consumer), original labels SHA, exact source/frame support,
selected original-ID SHA per patch, directed loop vertex-ID SHA and directed
edge `(u,v,ownFace,neighborFace,neighborLabel)` SHA, plane extrema and complete
invocation metadata/file hashes. Full actual selected IDs and loops remain in
the invoker's immutable hashed stdin; they are not renumbered or replaced by
the summary digests. Source helper bytes are hashed before/after invocations.

## Bounds and integration ownership

Preserve 150000 vertices / 100000 original triangles / decoded 8MiB mesh budget.
Concrete sequences and bounded represented dyadics use the reviewed cylinder
helper preflight. Derived-tool limits additionally allow at most32 cylinder
roles and32 planar patches, at most20,000 nodes per captured invocation and8MiB
aggregate JSON. Exceeding these is resource refusal, not invalid CAD geometry.
Native resource/process limits remain the existing invoker's, sequentially per
patch. No Python peak-RSS, overall latency, production quota or workload SLA is
claimed. Root's outer owned artifact process still supplies its normal limits.

New static source dependencies are this helper, `planar_coverage.py`, and existing
`cylindrical_surface_certificate.py` (pure bounded-number/radial predicates), plus
stdlib only. Existing CGAL executable/CPP/build source custody is unchanged.
Root owns adding the new helper to producing source/Git-object rosters and its
caller, binding source/semantic labels/material and complete raw/Trimesh/CGAL
proof, retaining analytic wall coverage/displacement and all original archive/
STEP/SVG/geometry criteria. No current caller or roster was edited here.
