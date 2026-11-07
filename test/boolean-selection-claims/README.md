# Two-input Boolean selection-claim reconciliation

Base CAD `403816df103fec4b12a385c426fb3331c13381bf`. This lane adds only the pure `modules/engine/mount/booleanSelectionClaims.mjs` and this test directory. No Worker/controller/native/public-plan/context/model/history/UI or default-engine changes are included. The helper does not call a kernel or classify geometry.

## Private API

```js
reconcileBooleanSelectionClaims({
  sources: [
    {claims: [{kind: 'edge', id: opaqueAuthoredID, sourceIndex: 1}], ancestry: rawA},
    {claims: otherCapturedClaims, ancestry: rawB}
  ],
  topology: actualResultTopology
})
```

Exactly two source snapshots are required. `kind` may be `vertex`, `edge` or `face`. Each source independently requires distinct IDs and distinct source indices per kind. Across inputs, the same ID must have the same kind and may union candidates. Native indices are1-based response-local observations, never saved IDs. The caller must bind these detached claims to genuine current source snapshots; this helper cannot prove a supplied raw observation came from native execution.

The frozen return value exposes data-only `resolved:[{kind,id,geometry}]`, `unresolved:[{kind,id,reason,candidateCount,reportedDeleted:[{input,reportedDeleted}]}]`, and `unclaimed:{vertices,edges,faces}`. Private `resolveVertex(id)`, `resolveEdge(id)` and `resolveFace(id)` return current native ordinals only for unique inherited bindings. `readGenerated(input,kind,sourceIndex)` returns a detached frozen raw target set for that native source row. These functions/ordinals stay inside the candidate owner; there is deliberately no public plan or authored context format here.

For each ID, only same-kind **SAME + MODIFIED** targets contribute inherited candidates, deduplicated within and across its two sources. Exactly one consistent target resolves. Zero gives `NO_DESCENDANT`; multiple gives `MULTIPLE_DESCENDANTS`. If different IDs claim any shared same-kind output member, both become `MERGED_DESCENDANT` (merge precedence also applies to overlapping splits). Native `reportedDeleted` flags remain separate per-input evidence and never override real descendants. A missing descendant is not independently verified physical deletion.

Generated topology is never inheritance. Generated vertices, edges and faces remain complete separate private evidence, including rows for source members with no authored claim. A generated target can coexist with another ID's inherited claim without stealing or merging that ID. No blend/rim/new feature key is invented. Result geometry types come from the captured catalog, with vertex geometry identified as `point`.

## Raw history and bounds

Actual seam-edge generation can produce vertices, so the preferred native schema is **version2**: source/result counts and complete ordered rows for `vertices`, `edges`, `faces`; SAME/MODIFIED/GENERATED target sets have all three fields. Every source row is validated, even unclaimed rows. Native target membership, order/count, unique members within each target list, strict exact fields and Boolean flags are checked. SAME cannot change topology kind. Other cross-kind relations remain preserved; they do not inherit a same-kind authored ID.

**Legacy version1** is accepted explicitly only with edge/face counts/rows/target sets. It is not converted into version2; no vertex rows are fabricated. Both inputs must have the same raw schema version. The private generated reader returns the actual version's fields unchanged. Version1 cannot accept vertex claims.

Geometric-count ceilings are1024 vertices/512 edges/256 faces per source/result,1792 claims per input. The entire captured input (including both histories and result topology) is capped at **524288 actual UTF-8 JSON bytes**, with bounded depth/node/array traversal. Returned data-only observations independently use the same524288-byte ceiling. These are cumulative caps: not every combination of maximal count/ID sizes is promised to fit. IDs are bounded at16384 UTF-16 code units. No unbounded serialization of caller input precedes admission. The exact input boundary passes; one byte more refuses. Native catalog validation runs only after strict detached own-data capture, so nested getters are never invoked.

Malformed integrity data refuses `ENGINE_FAILURE`; capture/observation resource excess uses `SELECTION_RESOURCE_LIMIT`; private resolver/read admission uses `INVALID_SELECTION` or `UNRESOLVED_SELECTION`. Empty native output is preserved as zero members and lost old claims, without new validity, solid-count or material inference. The topology validator checks an observation contract; this module does not establish geometric correctness.

## Evidence

18 groups PASS in a real Node Worker, no skips:

- Three replay existing **genuine recorded single-input edge-treatment** raw version1 histories, paired with an explicitly synthetic empty second source. They confirm actual raw-deleted survivors, lost connectors, unchanged genuine result types, and generated evidence. This is not a new native Boolean run or two-input ancestry qualification. Existing source fixture: `test/selection-ancestry/native-first-receipt.json`, pinned in `receipt.json`.
- Fifteen explicitly **synthetic joint-claim/data-admission** controls cover same-ID union, both-input merges/splits, vertex/edge/face namespaces, generated cross-kind relations, genuine-empty output semantics on a synthetic history, complete row/target validation, nested accessor refusal, unknown/sparse/cyclic/nonfinite data, explicit legacy boundaries, caller mutation/detachment, private resolver refusals and UTF-8 resource accounting.
- Exact captured byte boundary:524288. Returned data-only observation for that case:514352 bytes. Multibyte text control is rejected by byte count while its character count is below the cap; returned Unicode observation is likewise measured in actual UTF-8. The final output guard remains independent even though the stricter full-input cap often dominates.

`first-run.log` retains one test-fixture boundary mistake: appending one UTF-16 unit to CAP−1 characters reaches CAP rather than staying below it. The corrected control starts at CAP−2, appends one three-byte character, and verifies characters<CAP but bytes>CAP. No product or acceptance rule was relaxed.

```sh
node test/boolean-selection-claims/run.mjs
```

The runner records exact helper/catalog/source-fixture/test hashes. Fresh native Boolean version2 observations remain a separate forthcoming qualification; no public/Craft/host/save/ledger integration or native input-ownership claim is made here.
