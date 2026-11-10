# Finite-curve optional assets: source handoff

SOURCE ONLY / UNRUN. Base362451971a2bd88f1c986d1a6bfb1d2ff4c8ffc0.
Implements only the four NEW build leaves approved in
[Root leaf-composition review](CAD1-FINITE-CURVE-LEAF-COMPOSITION-REVIEW-20261109.md).
No existing/common helper, bootstrap, package, webpack, catalog, controller,
Native source/pair, runtime or frozen evidence is edited. No parser, tests,
preparation, build, module/import, Native or browser execution was performed.
No generated assets, binaries or SDK files are committed.

## Files and invocation contract for Root's later normal build

| New file | Purpose |
|---|---|
| build/prepare-finite-curve-support-assets.cjs | Fresh explicit input/output producer plus shared stage validation. CLI: node SCRIPT EXACT_NATIVE_INPUT [NEW_OUTPUT]. |
| build/finite-curve-support-assets-entry.cjs | Validate/reconstruct expected Worker and emit the actual five URL imports plus metadata to .build/finite-curve-support-entry.mjs. No arguments. |
| build/finite-curve-support-candidate-entry.mjs | Literal export default null, with no imports or Native access. |
| build/prepare-finite-curve-support-cohort.cjs | Optional normal-build wrapper. Reads only CODI_FINITE_CURVE_SUPPORT_NATIVE_DIR; absent/blank resets generated entry to null and does NOT read Native inputs. No arguments. |

Default stage is .build/finite-curve-support-assets. Fresh producer refuses ANY
existing output directory. Failed/partial stages are not repaired or deleted.
Existing default stage is reusable only after a fresh reproduction from the
explicit supplied input into a new owned verification directory, exact metadata
comparison excluding only the truthful output location, and full current-source/
staged-byte validation. Only that temporary verification tree is finally removed.
The absent branch preserves any old stage bytes but cannot publish them.

The entry and wrapper reset a previously generated entry to the literal null
source BEFORE any configured validation. Failure therefore cannot leave last
build's active import as a fallback. Successful entry publication uses one new
owned pending file, a second complete validation, then rename; pending cleanup
is owned build output only. This is unrelated to production Files/account state.

## Exact identities and closure

Input files are occ-portable.js (316530 bytes, SHA
479f0620b6dfe131dac05131a3798fc533e05a2bd11e8074ef240284f61bbe86)
and main.wasm (36216184 bytes, SHA
746da919c8457e98daa821fae98c62c0a6c9ad1acafd1c3d5412e0207d6b6325).
Both fixed pins AND the canonical candidate data must agree with actual Native
source d3b2afa0524807d04021eeeba3ca37298dabd160/tree
b3800d4e4c858b003b8a3cdead4b77e8e8918ba5. No old-pair alias/fallback.
Input hashes/bytes are checked before preparation and again before last manifest
publication; every output has actual readback hash/byte checks.

Manifest format finite-curve-support-component/1, sourceQueryOnly true,
finiteCurveSupportReadVersion1. Exact keys:
format,sourceQueryOnly,finiteCurveSupportReadVersion,sourceCommit,sourceTree,
jsSha256,wasmSha256,jsBytes,wasmBytes,bootstrapSha256,workerSha256,
queryImportRoots,sourceBindings,sources,files,output.

Five output imports are exactly:
modules/engine/mount/finite-curve-support-worker.js;
finite-curve-support-occ-portable.js;
finite-curve-support-occ.wasm;
modules/engine/mount/finiteCurveNativeCalls.mjs;
modules/engine/mount/finiteCurveReadProtocol.mjs.
The last two are the ONLY emitted Worker leaves, in canonical resource order.
Their static import closure is checked by the actual existing
assertOwnedProfileResourceClosure helper. Explicit bounded directory census
also rejects additional/missing/nonregular stage entries; component.json is
the last published file, never a substitute for actual bytes.

sources is exactly the two leaf hashes. sourceBindings captures actual bytes/
SHA of14 current source inputs before/after: bootstrap; embedded-display.cjs;
displayProjection.mjs; owned-profile-resource-closure.cjs; all4 NEW build files;
candidate/resources/Main wrapper/thin factory; and both Worker leaves.
Main wrapper/factory/data leaves are metadata bindings, NOT Worker imports.
The generated entry retains every manifest field except its private output
location, then adds real worker/js/wasm URLs and two actual modules URL entries.
Root's future catalog must validate these metadata/URL bindings before readiness.

## Shared bootstrap and embedding prerequisite

Temporary bootstrap guard is the ACTUAL current source SHA
a595182ee91dd0b91e400be5334c5c60f111b79168c4c50075eb97d09570e7cc.
It deliberately remains guarded. Current source lacks the new query import,
so preparation MUST refuse. Root must first compose the genuine query mode,
independently review it, calculate its actual hash and replace this guard along
with every other affected guard. No future digest is invented here.

Root explicitly froze the sole direct dynamic root:
await import(new URL('./finiteCurveNativeCalls.mjs',self.location.href)).
The producer requires that exact literal once plus the approved mode vocabulary,
and records its literal/canonical path. Whole reviewed bootstrap SHA remains the
branch/isolation authority; textual presence is NOT claimed to prove control
flow. Raw protocol is the adapter's transitive static import, not a second
dynamic root or extra resource.

Reuse actual embedDisplayProjection and its source-projection hash, plus the
existing closure checker. Existing embedded-oci-worker.cjs:embeddedWorker
CANNOT accept this pair: it intentionally guards old a84 glue. The NEW producer
retains the reviewed replace-once fetch/importScripts embedding seams and
lexical runEmbeddedRuntime convention, using the new exact479 glue identity.
It does not edit or bypass that old helper's guard. Source/Worker hashes bind
the actual helpers and embedded projection bytes.

The shared bootstrap's old compiled branches remain textually present but
unreachable in the approved query-only mode. No unrelated constructor/profile
resources are staged to imply those branches are admitted. New code must keep
query-only ABI/readiness independent of _InitCommands/model DB. These source
checks do not substitute for Root's full common-mode review.

Preparation bounds: source/leaf/glue reads <=1MiB each, exact known WASM bytes
within existing40MiB loader bound, generated Worker <=4MiB, manifest <=64KiB
on validation; finite static path census. These are derived build-tool bounds,
not production geometry quotas or performance claims. No Native glue is
required/imported/evaluated: it is read only as pinned text; pure candidate/
resource data imports and existing build helpers are the intended later Node
preparation dependencies.

## Remaining common composition and proof

Root still owns package build hook, webpack alias/asset rule/exclusion, optional
entry selection, dedicated catalog/factory admission, actual query-only
controller/OCI and all coherent bootstrap/hash refreshes. The optional env is
CODI_FINITE_CURVE_SUPPORT_NATIVE_DIR; proposed alias remains
codi-finite-curve-support-assets$, output prefix finite-curve-support/.
This packet alone enables none of those integrations.

Even a successful future preparation means checked assets only, not actual
module/Native readiness, captured original-source authority, finite events,
query accuracy, source edit permission or Gate1 qualification. Source extraction
and independent candidate verification remain separate packets. Root solely
executes eventual normal build/stage and the complete public lifecycle/FIRST
independent oracle after coherent source review.
