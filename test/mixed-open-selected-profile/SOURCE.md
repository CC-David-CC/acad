# V3 selected-extrusion mixed source policy — source checkpoint

This bounded source slice admits exact simple open chains only when their
outward-rounded source-plane bounding boxes are strictly separated by the
existing polygon provider clearance from every closed component and other open
component. Endpoint graph classification uses represented endpoint equality;
nonadjacent open-chain contacts and adjacent backtracking use existing exact
segment predicates. No welding, recentering, arrangements or Native geometry
algorithm is added. Failure to prove box separation is a refusal, not a claim
that the curves necessarily intersect. Open chains inside a circle/polygon box,
although possibly geometrically harmless, remain deliberately unsupported.

Both V3 selected-region discovery and actual selected extrusion preparation
recompute this policy on the complete genuinely solved source/digest. The Native
request/expected measurements, opaque region IDs and nine saved parameters do
not change. V2 and depth-free revolve/sweep/loft capture keep their strict default.
Construction-role curves and Points retain their already explicit nonboundary
semantics; unknown ordinary types are never ignored. Zero/duplicate/branched,
self-contacting and uncertain sources remain whole-source refusals. All closed
loops still enter the existing global containment/hole qualification.

V3 extrusion discovery adds canonical `sourceAnalysis`:

```
{version:1,policy:'v3-extrusion-isolated-open-chains',clearanceMm:0.0001,
 closedComponents:[{kind:'circle'|'polygon',curveIds:[actual local IDs]}],
 openComponents:[{kind:'open-chain',curveIds:[actual local IDs],
   reason:'OPEN_NON_BOUNDARY',separation:'outward-aabb-clearance'}]}
```

Component rows and IDs are canonical; the main metadata consumer verifies every
ordinary solved-source curve belongs to exactly one component and every region
outer/hole belongs to a reported closed component. No IDs are inferred from their
spelling and no rows are truncated to fit. The existing64KiB response budget,
512-segment/128-loop provider domain, source/digest/currentness bounds and native
resource ownership remain. Only Worker-side helpers perform geometry work.
The provider constant is exported without changing its value or algorithms.

For Segment(0,0)→(30,40) and Circle(60,20)R5, max Segment X30 and outward Circle
minX immediately below55 certify ample separation. The Circle alone defines the
selected face; the Segment remains in the source/digest and explicit report.
Changing it into the circle's box requires atomic refusal rather than silently
filtering it. General arrangements and E05 combined edit/reselection remain open.

No tests, TSC, builds or browser execution have run at this source checkpoint,
following the user's complete-workflow-first cadence. A prepared public driver
will be a separate new-file checkpoint and wait for the composed exact runtime.
