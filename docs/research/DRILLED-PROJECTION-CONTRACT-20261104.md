# Drilled prism projection: proposed bounded contract

This is a design and test contract, not an implemented model or a promise that the worker can provide the necessary native data. Its first and only target is the OCC same-mount centered through-cut of a validated rectangle prism. Native Mesh and cross-engine operands must explicitly refuse. No DOM or canvas is required by the worker boundary.

The worker and projection must agree on one versioned, bounded portable response. Its local face/edge/vertex identifiers only connect records inside that single response. They are neither authored identities nor persistent references. A current candidate owner must bind the response to the exact parent source revision, digest, face, region and worker mount/generation, and to the hole feature/intent. A response received after a source change, cancellation, account/window close, owner disposal or mount replacement is refused. Worker tokens and native pointers never enter the model or persisted history.

The intended result describes ten finite vertices, fifteen shared edges, and seven faces: six planar faces and a cylindrical wall. Two planar faces have a circular inner loop. The cylindrical wall's periodic seam occurs twice in its loop, with opposite uses of the same edge and same face; this is not the distinct-face incidence rule used by the prism reader. Every directed loop must close by vertex identity, each edge must have exactly two consistent uses, and the model must retain the same actual topology instead of inventing twins or deleting the seam.

A line, circle, plane and cylinder need native analytic frames and finite domains sufficient for consistent `point`, `param`, derivatives and orientation, including circle/cylinder X and Y axes, axis direction and angular/axial ranges. An axis and radius alone do not fix the parameter origin or handedness. Face orientation and individual coedge orientations must be explicit. Tessellation is separately bounded display data; it is never the mathematical curve or surface and cannot by itself establish exact CAD topology, kernel validity, or ancestry. Reject unsupported, nonfinite, sparse, oversized, inconsistent, ambiguous or missing descriptors instead of substituting a polygon or a null surface.

Semantic roles may only be published after the worker proves source provenance through actual kernel history and unambiguous checked correspondence. In particular the parent BASE, LID and each source-edge SWEEP need validated descendants; hole wall and its base/lid rims need explicit association with the new feature. If a face is split, deleted, merged, ambiguous or unproven, fail rather than assign a durable role by response ordinal or geometric proximity. Vertices and the seam remain transient; identity lengths and collisions must be checked against the native registry limit. No claim is made that the current early native query already provides these roles, display tessellation or complete analytic frames.

Required acceptance tests, using a real worker response in addition to bounded adversarial data:

- Verify analytic circle/cylinder evaluation, derivatives, parameter domains, endpoints, orientation, normal and seam for both support planes; validate circular loops and opposite seam uses without fabricating twins.
- Verify seven faces, fifteen edges, ten vertices, closed incidence and actual parent/hole roles. Check outer bounds and independent analytic volume `100000 - 500π` for a 100×50×20 mm parent with diameter 10 mm. Tessellated volume is a separate approximation.
- Resize the parent and preserve only roles justified by history, with the circle at the recomputed center. Reject stale source/owner/mount, duplicate durable IDs, mismatched role mapping, invalid or changed radius/frame, touching/oversized hole and incomplete/malformed output.
- Exercise finite size/record/visit limits, sparse arrays, accessors and nonfinite values, cancellation and worker death. Failed or stale projection must publish nothing and leave the previous accepted result intact.
- Confirm compatibility only with explicitly adapted consumers; legacy pointer consumers, native persistence, UI and generic Boolean/fillet/export remain guarded until individually qualified.

The existing `Loop.isCCW()` derives a polygon from half-edge start vertices. A closed circular edge can have the same start/end vertex and form a one-edge loop, so that helper cannot establish its orientation. Do not call it as a validation oracle or expose this model to consumers that assume a polygon with at least three vertices; use verified analytic coedge orientation and keep those consumers guarded until adapted.

## Lead native-output diagnostic

`node test/engine-hole/inspect-native-control.mjs PATH_TO_NATIVE_JSON` checks
only the nominal 100×50×20 mm / diameter-10 control. Against the observed
standalone query output SHA-256
`ae77e1e6bc0dde42a95b4d9a8c9e14989f56079e916d0f97acff0486c737094d`, it passes
closed coedge chains, opposite paired edge incidences, exactly one same-face
cylindrical seam, analytic inner-loop orientation on both support planes and
nominal volume. Mutated endpoint and circle-direction controls fail. This
repeatable diagnostic records a reported BRepCheck flag; it is not an independent
kernel validity or ancestry proof. The native source/runtime is still being
qualified; the temporary JSON is not a committed final runtime prerequisite.
The worker owner must supply its pinned source/runtime and regenerated actual
operation-local response before this becomes integration evidence.
