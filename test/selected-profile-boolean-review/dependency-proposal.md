# Next bounded ancestry change: generic solid source dependencies

Review target: CAD323866. This is a proposal, not an implementation or claim of
successful dependent replay. Shared ancestry code remains coordinator-owned.

The current strict ancestry helper knows selected-profile features but returns
false for generic BOX/BOOLEAN operations. Its sentinel is used for whole-history
source-transition classification and independent plane creation. Therefore a
known valid Boolean can disable those paths despite retained editable planes.

## Minimal model

Retain the existing bounded256-entry history walk and legacy plane/prism/hole/
enclosure validation. Add a small private map of **live generic outputs**:

```text
canonical output ID -> {producerFeatureId, engine, registeredRevision, sourceFaces}
```

Generate map keys using the existing canonical `solidBodyId(featureId)` rule.
Resolve caller-authored `a`/`b` by exact map lookup; no substring/split heuristic
or guess from a region/body display name. The map contains only earlier
producers. A consumed ID is removed, so it cannot be reused by a later feature.

| Known operation | Exact raw parameters | Source dependencies |
|---|---|---|
| WORKER_SOLID_BOX_V1 | version, unit, engine, engineRevision, featureId, x, y, z, width, depth, height | Empty set |
| WORKER_SELECTED_PROFILE_EXTRUDE_V2 | Existing exact nine-field validation | Explicit source faceId |
| WORKER_SOLID_BOOLEAN_V1 | version, unit, engine, engineRevision, featureId, kind, a, b | Union of both earlier live parents' sets |

Every field must remain an own enumerable data property; reject extras,
accessors, hidden/symbol/inherited-only required fields. Require numeric
positive safe feature IDs and retain global duplicate-ID rejection. BOX origin
coordinates are finite numeric abs<=1e6; dimensions are finite numeric
0<value<=1e6, matching existing captureSolidBox. BOOLEAN kind is exactly
union/subtract/common; operands are distinct nonempty bounded strings and exact
live map keys. Common version/unit are1/millimeter. Validate engine and exact
revision through the registered build catalog, never merely a hash regex.

A Boolean must match both parent engines/revisions and preserve that build.
Retain the generic ledger's existing one-engine/one-build-per-evaluation rule
across generic producers; do not accidentally admit malformed history that
mixes unrelated generic runtimes. This is not automatic kernel conversion.
Do not treat the old rectangle/enclosure IDs as generic solid outputs.

On a Boolean, consume both parent map entries and register its canonical output.
Retain dependency sets even when the current native result is empty. A later
parameter change can make that same operation nonempty; emptiness must not erase
authored dependencies. Both MWorkerEmpty and MWorkerSolid use the same opaque
feature output ID. No native geometry, face count, mesh or measurement belongs
in this lightweight history classification.

For the existing actual-target query, continue refusing a fast save whenever
that target is a selected source. Reaching an empty Boolean is not permission
to skip regeneration. For the sentinel/unrelated-target query, all recognized
well-formed history can continue; unknown operation kinds and malformed/missing/
forward/consumed parents still refuse. All limits and legacy guards remain.

## What this permits, and what it does not prove

The helper only permits the existing full candidate replay to be attempted.
Actual source/frame/region checks, private overridden source bytes, genuine
Workers, registered mount checks, input preservation and one atomic publication
remain authoritative. Do not invent replacements for changed region IDs,
silently reattach faces, switch engines, or enable legacy expression support as
part of this fix.

After implementing, rerun strict metadata guards plus actual public acceptance:

1. Same two-circle selected-body Boolean as the boundary probe. Original r10
   circles at x0/30 extruded5 give disjoint union volume1000*pi.
2. Diameter of the first circle20→24 via the existing public diameter/full-replay
   command. If supported, require volume1220*pi, two valid solids, bounds
   [-12,-12,0]..[40,12,5], exact identities/selection and no unrelated changes.
3. Create an independent XZ plane at7 after that Boolean. Existing solid metrics
   and source assignments remain unchanged.
4. Default box plus unrelated editable plane: source dependency is empty,
   while the default registered build remains unchanged.
5. Nested Boolean dependency unions; reject unknown, forward, reused-consumed,
   repeated or mixed-build operands before any fast-save admission.
6. Empty-result dependency retention; future empty→nonempty regeneration must
   use the same authored output identity and require both source dependencies.
7. Rejected/stale/canceled replay preserves prior source, models, history and
   journal; genuine late Worker replies remain inert. Undo/redo/save/reopen
   requires source-matched qualification before claiming complete integration.

This is deliberately a bounded known-operation graph, not a new plugin system
or a second editable geometric model.
