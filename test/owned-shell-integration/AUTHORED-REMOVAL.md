# Shell authored face retirement

This source repair follows the complete signed R4 workflow on source
`5779b218fba247f71d55adf3dae203f400c9c671`. Its unchanged failed receipt is
`/tmp/codi-owned-shell-signed-proof-r4/receipt.json`, SHA256
`a9b65f7c39aa1b4e48539f9648381c9b34e8c810bbc5858f373ba21c11c90331`.
The last row, “Already removed source top face is not invented on shell
descendant raw outcome before assertions”, received `SHELL_BUILD_FAILED`
instead of the required `UNRESOLVED_SELECTION`. The actual current descendant
plan still advertised the original Z_MAX identity after that authored face had
been removed. Earlier geometry, thickness/source edits, mixed history travel
and collapse/stale refusal observations remain in that failed receipt; this
repair does not relabel the overall run as passing.

The shell Worker still validates its actual detached-copy certificate, source
and result topology census, and complete Native ancestry v2 before deriving any
selection plan. `deriveShellSelectionIndexV2` reconciles every genuine source
claim against that full ancestry, then retires only the captured request's
`removedFaceIds` from the new private face resolver. It does not filter Native
history to change merge/split reconciliation. The source index is unchanged.

Each retired identity is represented in the v2 unresolved rows by exactly:

```js
{kind:'face', id, reason:'AUTHORED_REMOVAL',
 sourceFeatureId, featureId, originFeatureId}
```

Here `sourceFeatureId` is the current input producer when removal occurred,
`featureId` is the shell feature that retired it, and `originFeatureId` is the
original authored construction. This is an application semantic observation,
not a Native deletion assertion: there is no `reportedDeleted` or
`candidateCount` field. Actual kernel descendant relations remain separately
validated and unmodified. Generated rim/wall faces acquire no new authored
identity; aggregate unclaimed counts derive from the actual result census.

Subsequent unary, edge-treatment and Boolean lineage carries this exact first
retirement row. A competing branch resolving the same opaque ID remains a
selection-unavailable conflict; it cannot resurrect the retired identity. The
existing private ledger snapshot and Worker face resolver remain the binding
authority. No additional saved flag or model field is introduced: the saved
shell request's `removedFaceIds` is the sole authored removal intent and replay
derives the observation again. Undo to a prefix before the shell retains the
original source's unmodified selection map.

No tests, isolated Native calls, compilation or browser runs were performed for
this source checkpoint, following the requested end-to-end workflow. The next
check is the unchanged complete signed shell driver after a normal combined
build. Native portable JS `57b74074…` / WASM `60dc956b…`, OCI bootstrap and all
other operation requests remain unchanged. The source graph already stages
both changed Worker modules; a fresh build must capture their new bytes.
