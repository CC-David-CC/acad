# Owned shell transport — integration checkpoint

This source introduces a new explicit OCC cohort; it does not promote defaults
or migrate any saved part. No isolated tests, fake-native successes or geometry
prototypes were run. The final Native build is preparation; complete shared
application acceptance remains pending.

Native code: `aa86022d` plus namespace-only compile correction `910aab31`, new
`ownedShellV1.hpp`/`ownedShellFFIV1.hpp`. The first compilation error is retained.
R730 final output: `/mnt/data10tb/codi-occ-owned-shell-main-20261107-r2`.

- Portable JS57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858,
  314939 bytes.
- WASM60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947,
  36048090 bytes.
- Exact revision is `sha256:<portable SHA>:<WASM SHA>`. The Native source keeps
  STEP/HLR/adaptive measurement/manufacturing and earlier modeling entrypoints.
  Their availability on the new cohort is explicit, not a new qualification claim.

`createShellOccMount(options)` uses the ordinary Worker controller and actual
owned-name engine. Every inherited flag/capture is retained; shell=true requires
the exact new native hashes. Non-shell mounts keep their existing requests and
runtime guards. New request:

```
{op:'solid.shell', version:1, unit:'millimeter', handle,
 featureId, producerFeatureId, removedFaceIds:[opaque authored IDs],
 thickness, direction:'inward'}
```

Select1–16 unique bounded IDs, positive finite thickness≤1e6. Identity metadata
is bounded64KiB. Capture happens before asynchronous dispatch; face IDs resolve
only through the current private producer's index in the Worker. It sends actual
response-local native indices, verifies their unchanged memory payload, and
never saves/emits those indices as authored IDs. Native result copy certificates,
original/result census and full v2 ancestry are checked Worker-side. Generated
inner/rim entities stay unclaimed; only genuinely unique ancestral faces that
were not deliberately removed retain keys. Authored removal retires the old
identity even when the kernel reports a unique rim descendant; see
[AUTHORED-REMOVAL.md](AUTHORED-REMOVAL.md). Missing ancestry disables naming while
geometry remains distinguishable.

Success is ordinary `{op:'solid.shell',contractVersion:1,handle,evidence}`.
The private reply additionally echoes the six-field shell binding. The controller
requires exact current input/output routing, positive valid single-solid native
measurements and the captured source still bound before creating its handle.
One candidate result is charged using existing lifetime/name/cumulative-triangle
budgets. Ordinary native/domain/resource refusals keep the Worker ready; input
mutation, malformed results and cleanup faults close it. Candidate ownership
must remain separate from accepted state; terminating a real owning realm does
not preserve its native handles.

## Initial box faces

Only this cohort's `solid.box.create` adds required internal featureId to the
existing origin/dimensions/version/unit request. The ledger supplies the genuine
authored feature. The new native constructor uses real MakeBox face handles,
not a nearest-coordinate match or topology ordinal masquerading as identity.

`solid.selections.read` returns the existing v2 envelope. Initial box plan.source
is `box-construction-history`, sourceContexts is exactly
`[{kind:'box',featureId:originFeatureId,regionId:null}]`. Six face descriptors have
exact `{id,role,geometry:'plane',originFeatureId}`. ID is
`worker-box-face:1:`+JSON.stringify([originFeatureId,role]); callers treat it as
opaque. Role is X_MIN/X_MAX/Y_MIN/Y_MAX/Z_MIN/Z_MAX. Edges/vertices are initially
unnamed with truthful aggregates; this does not manufacture a sketch region.

Inherited plans use `kernel-operation-history`. Axis role remains the source
identity, not a new coordinate/extreme classification of a descendant. Generic
lineage admits explicitly discriminated box/null or real sketch-profile contexts
without changing old prism IDs. Shell deliberately does not carry semantic hole
or pattern constructor authority through an offset. Drawing witnesses propagate
only through genuine ancestry or remain unresolved.

## Complete acceptance to run after composition

Actual public box100×50×20 → discover genuine Z_MAX face → shell inward2 then3,
with independent expected volumes20512/29688mm3 and original bounds. Observe open
cavity/bottom/side/exterior material truth using real native point queries. Edit
source dimensions; travel creation/numeric/source changes; reject collapse,
stale/wrong producer/build/face inputs without changing last accepted source,
history/journal/resources. Normal Save/server bytes/fresh Open/reedit uses the
same authored feature and opaque selection IDs. Source-driven identities must
survive replay; no indices or copied model snapshots are authored state.

This bounded first workflow does not qualify every curved shell, inward
self-contact, multiple removed faces, outward shell, human tool or engine. Other
engines remain unsupported explicitly; no fallback or box-cavity recipe exists.
