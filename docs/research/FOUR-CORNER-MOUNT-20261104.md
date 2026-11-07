# Four-corner worker mount candidate

The opt-in mount exposes `solid.profile.four-corner-through-holes` only when `fourCornerCut` and `centeredCut` are explicitly true and the exact incremental research wrapper/WASM pins match. The c397 centered-only runtime does not advertise or accept the operation. The incremental runtime is not a clean-build release or production qualification.

`mount.fourCornerThroughHoles({op,version:1,parent,request},{signal})` accepts a still-live same-mount centered-result handle and the exact authored planner intent (including feature and side IDs). It retains both the centered parent and original prism's private records, copies request data, sends a private worker token, checks both ancestors still exist after the result, and stores an immutable-by-value topology/binding receipt before returning detached topology and an opaque handle. `assertFourCornerBinding(handle,parent,binding,topology)` checks that live relationship and exact bounded data. Tokens and native pointers are not returned. Abort after dispatch terminates the candidate mount; abort before dispatch does not create a result.

The worker must authenticate its own captured parent and prior intent, recompute the plan, run its bounded topology validator, and fail/terminate on any post-native defect before mapping a result token. The mount checks response limits and exact source/intent binding; it does not independently prove the worker's operation history. Feature IDs are syntactically validated and bound to the receipt, but neither this mount nor the current worker knows their CAD history identity; the future ledger/projection adapter must prove those identities and document lifetime at publication. The mount's retained-handle checks do not replace history epoch checks. Do not register this candidate as a CAD feature until owner projection and real history integration pass.

Focused `node --test test/engine-four-corner/mount-contract.test.mjs test/engine-hole/mount-capabilities.test.mjs` checks bounded copies, accessor refusal and capability pins. `test/engine-four-corner/actual-mount.test.cjs` ran against a disposable strict-CSP Chromium fixture using the actual incremental four-hole worker from `/mnt/data10tb/codi-four-corner-actual-worker-fixture` and current candidate mount. It passed actual translated 100×50×20 centered-plus-four geometry (volume 97423.8940240563), same-mount binding, stale/cross-mount/tampered/touching refusal, source disposal, in-flight cancellation closing only its candidate mount, and a real three-of-four injected native failure closing its mount. No browser DOM or canvas is used by worker contracts. Source identities and publication guards remain unqualified. One-hole legacy absolute line parameter origin remains unverified.

## Root integration qualification

Integrated Worker and mount together at `8af62832`. Independent root run in a fresh Chromium context against an isolated R730 strict-CSP fixture passed the actual-mount test: volume `97423.8940240563`, ten rims, stale/cross-mount/tampered/touching refusals, source disposal, in-flight cancellation, and a native partial-cut failure. The previously accepted separate mount remained usable. This is still the incremental `0e08888f` native runtime, not clean-build or authored-history acceptance.

Fourteen focused topology/provenance/mount checks passed on the integrated tree. Packaging was then corrected to include the four-corner dynamic helper modules and the new controller import in older standalone fixtures. Nine build/mount controls passed, including deterministic embedding, changed-source/WASM refusal, exact emitted helper bytes, and capability gating. The centered-only clean runtime remains `c39793b8`; its updated embedded Worker is `a47c7b937ba2372875c4ca24ba043d8042a8ada744e577a53b4302f765f6814b`. Adding Worker source support does not advertise four-hole capability on that old runtime. No desktop registration, public deployment, or native clean-runtime promotion is claimed here.

Next: bind authored parent/center IDs and document lifetime through the owner ledger, project the checked eleven-face result, register the feature, and prove edits, undo/redo and native save/reopen. Worker correctness alone does not satisfy those gates.

## Clean-library runtime integration

The runtime preparation and default verified OCC mount now select native source
`8c4f3004`, original JS `81996d39`, wrapper `a8774acb`, and WASM `13617eda`.
This artifact links the source-exact line-frame child against the fresh OCCT
libraries built from `846bea93`; it is not a second independent rebuild.
The build receipt is `test/engine-four-corners/CLEAN-BUILD.md`. Both LAN stores
hold the final artifacts. Webpack explicitly emits the four-corner dynamic
modules beside the Worker. Embedded Worker SHA256 is
`b0713d865ec90f3778f65118098138a86fc6dba707070374f9eb166d5e03a3ca`.

Root independently repeated the real mount test with clean `13617eda` and all
binding/refusal/cancellation/partial-failure checks passed. Nine focused
packaging/mount controls also passed. The new default runtime still needs an
exact-source full application build and existing history regression before any
public CAD promotion. Registration of the four-hole feature remains separate.

## Authored owner/projection integration

`01fb7e6b` integrates the retained-centered-result ledger, eleven-face projection,
explicit side-reference intent, and unregistered feature factory. Root reviewed
the same-owner/source/feature and publication checks and independently passed
six intent/mount tests, thirteen existing ledger regressions, and full TypeScript
checking. Agent actual browser evidence covers original/resized projections;
root full application history evidence is still pending. The four new walls
and eight new rims use same-Boolean tool ancestry; prior center rims remain
transient because parent-edge ancestry has not been proved. Side-ID UI/agent
production and actual history/save/reopen remain open.
