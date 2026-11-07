# Owned edge-treatment selection ancestry — bounded pure component

Product file: `modules/engine/mount/selectionAncestryIndex.mjs`. This lane owns
only that new module and this test directory. No Worker/controller, geometry
kernel, solver, public API, model/history schema or UI was changed.

```js
deriveSelectionAncestryIndex({
  sourceIndex, ancestry, topology, featureId, kind, selectedEdgeIds
}) // => Object.freeze({plan, resolveEdge, resolveFace})
```

SourceIndex is the current private index returned by createPrismSelectionIndex
or a preceding derivation. Caller binds it and native evidence to the same live
input/result/lifetime. This module validates evidence, not native geometry.
Kind is fillet or chamfer-equal; selected edges are1–16 distinct current IDs.
Plan.featureId is the current treatment producer; regionId retains its origin,
scope is authored-source and source is kernel-operation-history.

Only deduplicated SAME+MODIFIED targets of an old key's own topology kind are
survivor candidates. One retains its exact ID; zero/multiple are unresolved.
Any shared target makes its different old keys MERGED_DESCENDANT, including a
simultaneous split/merge. Edge/face spaces remain separate. Raw reportedDeleted
never overrides a real descendant. NO_DESCENDANT+false is unknown, not proof
of deletion or permission to choose a convenient replacement.

Detailed unresolved rows are exactly
`{kind,id,reason,candidateCount,reportedDeleted,featureId}`; reasons are
NO_DESCENDANT, MULTIPLE_DESCENDANTS or MERGED_DESCENDANT. FeatureId is the first
failed mapping producer and survives later operations. Old aggregates are not
carried; recompute current native entities as
`{kind,count,reason:'UNCLAIMED_KERNEL_ENTITY'}`. No native indices enter the plan.

Generated edges/rims get no invented IDs. A new face can receive
`worker-edge-treatment-selection:1:` + JSON
`[featureId,kind,'face','blend',sourceEdgeId]` only for one uniquely generated
face of that selected source edge. All source-edge generator rows are checked,
including un-authored/unselected co-generators; retained faces cannot also be
renamed. New descriptor:
`{id,role:'blend',sourceEdgeId,kind,geometry:<actual catalog type>}`.
Other generated geometry stays unclaimed. Old descriptors retain their source
metadata and update geometry type from the result catalog.

Immutable plans are limited to512KiB actual UTF-8 JSON, with incremental row
charging and a final exact check. Keys≤16384 UTF-16 units match resolvers;
native edges/faces≤512/256. Detailed unresolved history≤4096 plus two current
aggregate rows. Bounds throw SELECTION_RESOURCE_LIMIT without declaring native
geometry invalid. Exact source/result counts, dense source membership, unique
in-range targets and result catalog fields are validated.

## Verification

```sh
node test/selection-ancestry/run.mjs /tmp/selection-ancestry.json
```

**20 actual Node Worker groups pass**: four replay genuine recorded native
main-export observations; sixteen are explicitly synthetic metadata controls.
This is not fresh WASM execution, browser integration, public fillet/history,
general Boolean naming, manufacturing or whole Gate1 proof.

Immutable first native receipt SHA
`a1a99f0f6178aa64463a1688a1b3022880821fde68f027751378bcd7fd2496d7`
contains actual input/output catalogs, prism construction, selected local edge
indices, metrics and ancestry. Provider source6d8395a6, portable JSb3d91cbb…,
WASM28e8e2c2… are in native-source-pins.json from the separate native lane.
That lane's final07098de9 adds input snapshots; the first receipt is unchanged.

The replay assigns explicit **component-side labels** e0…e3 to actual source
slots after checking cap vertices (0,0),(100,0),(100,50),(0,50). These are not
recovered CAD IDs, saved-history seeds or public sketch authoring.

| Native case | Independent expected mm³ | Propagated result |
|---|---|---|
| OneR3 corner fillet | 100000−20×9×(1−π/4) | 11 edges,7 faces,1 blend face |
| One1mm corner chamfer | 99990 | 11 edges,7 faces,1 blend face |
| Far-corner chamfer after fillet | prior−10 | 10 edges,8 faces,both blend faces |
| Same fillet replayed atR2 | 100000−20×4×(1−π/4) | same key sets,new volume |

Seven raw-deleted native edges have unique descendants and remain resolvable.
The treated edge becomes NO_DESCENDANT. Four new rim edges remain unclaimed,
then eight after the second treatment. The first unresolved producer stays101
after103; the first blend face survives the second operation.

Synthetic controls cover dedup, missing/split/merged descendants, overlapping
split/merge, Generated not replacing old entities, ambiguous or survivor-covered
generated faces, un-authored co-generators, per-kind collisions, prior unresolved
rows, updated geometry types, malformed counts/indices/duplicates/accessors,
source/caller admission, key overflow, multibyte UTF-8 budget, determinism and
immutable inputs. They do not claim native geometry produced those situations.

No assertions were weakened. Initial four/eighteen/final twenty-group receipts
retain exact source hashes; the product module is the same in all three. No
browser/Files/account/race/security test, fake UI/solver, fallback or source/
dependency packaging was performed here.
