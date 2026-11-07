# Initial prism ancestry: actual source relationships

Use BRepPrimAPI_MakePrism FirstShape(source), LastShape(source), Generated(source) while the builder exists, after proving the exact source edge/vertex belongs to the final basis. This avoids result-order or nearest-geometry naming. It establishes initial relationships; later Boolean splits/merges still require explicit ancestry reconciliation.

The inspected OCCT headers explicitly warn MakeWire::Edge() may differ from Add(inputEdge). The actual ordinary C++→WASM probe demonstrates why: independently constructed point-pair rectangle edges retain only1/4 original TShapes in the final wire; MakeWire-returned edges retain4/4. Shared native endpoint vertices preserve4/4 rectangle and5/5 concave source edges. No original source edge survives Copy=true into the prism result, but the explicit first/last/generated maps remain correct.

Source probe: prism-provenance-probe.cpp. Final ordinary cases are independent rectangle, shared rectangle, shared concave polygon, shared concave with reversed circular hole on an oblique frame, concave with mixed circle/polygon holes, and a circle annulus. Native validity and area×7mm volume are checked. Result targets are unique native result members. Shared rectangle maps8cap edges/4side faces/4vertical connectors; concave maps10/5/5. Circle rim/sweep links are distinct from outer-loop mappings; its native seam is not an authored corner. This is native scratch geometry, not a seeded public CAD/history workflow.

## Minimal root-owned construction change

1. V2 remains unchanged. For admitted V3 polygon junctions create one shared TopoDS_Vertex per junction, then edges from those shared native vertices. Do not tolerance-weld or repair coordinates.
2. Bind each edge to its exact captured source curve before wire creation. Check the final wire and face retain that edge and vertex identity; if unexpectedly replaced, refuse the provenance claim rather than nearest-match. Reversed hole-wire orientation must be represented separately from underlying identity.
3. After successful prism build, capture before destruction: face→FirstShape()/LastShape(); source edge→FirstShape(edge)/LastShape(edge)/Generated(edge); authored polygon vertex→Generated(vertex), with its cap vertices available too.
4. Copy Generated list values immediately. The inspected implementation clears/reuses the internal list on every call; retaining list references across subsequent calls would corrupt the map.
5. Full circles have no authored corner at their synthetic seam. Map circle cap rims and swept face, leave seam-connector identity unqualified.
6. Insert the owned final shape only after the caller's required geometry/provenance checks. Runtime handles remain private. An unsupported provenance relation is not evidence of invalid geometry.

## Added native helper, parent integration ownership

NEW native shape-io/profilePrismProvenanceV1.hpp (no selectedProfileV2.hpp/main.cpp edits by this lane):

```
e0::profile_prism_provenance_v1::capture(
  const vector<vector<TopoDS_Edge>>& edgesByLoop,
  const vector<vector<TopoDS_Vertex>>& authoredVerticesByLoop,
  BRepPrimAPI_MakePrism& builder, const TopoDS_Shape& result) -> string
```

Reply: version1, scope=response-local, persistentIds=false, caps.firstFace/lastFace, sourceLoops[{loop,edges[{source,firstEdge,lastEdge,sweptFace}],vertices[{source,firstVertex,lastVertex,sweptEdge}]}], resultCounts. Source ordinals are zero-based transport slots. Output indices are one-based, from the same ownedTopologyV1::Maps traversal as the catalog. Neither is a saved ID.

Checks: same exact finished prism/result, one valid native solid, input-loop bounds, used source native objects, shared polygon endpoint incidence, complete circle/no authored seam, unique result membership/types, global cap/side/connector target uniqueness, and complete expected prism topology counts. Provenance/resource failures throw PROFILE_PROVENANCE_UNSUPPORTED, PROFILE_PROVENANCE_RESOURCE_LIMIT, or PROFILE_PROVENANCE_FAILED; they must not be presented as geometry-invalid.

Numeric construction buffers lack string IDs. Bind each source slot to the exact same captured authored request's curve/junction record in the Worker, then derive persistent semantic keys. Never persist input-array slots or native result ordinals. Proposed edge roles: source curve + BASE/LID; side face + SWEEP; source-junction CONNECTOR via canonical incident authored-curve pair, scoped to feature/region. Use actual existing source point IDs when there is a qualified shared endpoint identity, not coordinate equality.

Carry those keys through subsequent cuts using exact native same/modified/generated membership and unique supported descendants. Missing/split/merged/ambiguous relations stay unresolved. The catalog's reportedDeleted is raw evidence: fillet/chamfer can report deletion even where an edge is actually retained. Do not create tombstones from that flag alone.

## Bounds and proof scope

V3 construction can admit512source curves, while the current catalog/Maps caps512result edges/256faces. Large valid prisms can exceed the catalog/provenance budget. Retain honest RESOURCE_LIMIT or deliberately review a larger bounded transport policy; constructor maximum is not automatically selectable-provenance coverage.

Actual standalone helper6-case proof (5capture cases,4 same-geometry absent-native-source refusal controls) and source/runtime pins are recorded in provenance-evidence/. The first four API-only observations remain separately outside Git and are not relabeled as helper qualification. Generated outputs remain outside Git at /mnt/data10tb/codi-owned-prism-provenance-v1-proof-20261106. Reuse the existing Emscripten2.0.30/OCCT include/archive paths from the owned topology helper; O1/C++11, exception handling, memory growth, Node environment. Disable modern Node global fetch before requiring old Emscripten glue.

No native main/other helper product files, public app, authored history, Files, services or deployment changed here. No browser or filesystem-race/security tests ran. Parent owns combined native commits/export/build. This evidence does not qualify public source binding, undo/save, E11 or the full plate chain.
