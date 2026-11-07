# Native diagnostic checkpoint; strict Manifold Join remains unqualified

Native source **9056c1fab8f5009da70f0826964e90ac739dfc55**, branch `feature/manifold-join-diagnostics-20261106`, is backed up at:

- `example.invalid:/srv/data/git/manifold-codi.git`
- `r730:/mnt/data10tb/git/manifold-codi.git`

R730 checkout: `/mnt/data10tb/codi-manifold-join-native-20261106`. Complete probes, original failures, compact observations, exact pins and receipt are under `research/join-diagnostics-v1/`. Runtime binaries and full build logs remain outside Git at `/mnt/data10tb/codi-manifold-join-diagnostics-build-20261106-r1`.

This CAD commit changes **tests/evidence only**. Native source changes only manifold.h, manifold.cpp and WASM bindings.cpp: additive read-only existing-native boundary-distance, oriented-topology, self-intersection, epsilon diagnostics. No current app, provider, Worker, policy, history, runtime, or native OCCT change. The previous investigation is frozen at CAD4a886f94b.

Actual Node/WASM evidence: 18 geometry rows plus three box-only single-boundary observations. New boundary-only distance distinguishes proper cavity gap4/sqrt(12) from point/edge contact0. Existing public MinGap's solid-intersection shortcut returns0 for proper cavity boundaries, so it could not make that distinction. Same-archive C++ proof:16 shapes,44 bitwise native double MeshGL64 preservation snapshots,16 two-input pair reads,4 invalid-bound controls. No browser/app/Join proof is implied.

**Open blocker:** in a 30-cube, subtract an exterior notch at(-1,-1,-1), dimensions(16,16,16), then another at(15,15,15), dimensions(16,16,16), or(15,15,-1), dimensions(16,16,32). The void boundaries touch at a point/edge **within one native connected boundary component**. Both actual outputs report NoError, one positive component, Is2Manifold=true, IsSelfIntersecting=false; volumes20250/16875 match arithmetic. Separated control20881 has the same flags. No signed-component or current/new diagnostic combination establishes a general Join certificate.

Experimental WASM636b7dc8e03a31a355ce5d7ec5a2bf3bb449eb7ea1c0aba5819bfb467d46ca0f; gluecd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b unchanged. The actual app cache was rehashed unchanged: same glue and WASM7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d.

`node check.mjs` verifies the included immutable subset against the native receipt. Full 21-row arithmetic checker/producers are in the native repository. Only metadata/selected tiny observations are duplicated here, not WASM or source bundles.

## Smallest next native experiment (proposal only)

Add a **test-only native contact witness probe** over these three frozen notch results, ordinary cube triangulation and a valid cavity. Reuse native halfedge identities, native double positions, BVH candidate pairs and distance routine. Report the exact triangle/vertex/edge identities for zero-distance contacts and whether they are incident in native topology. Compare the old diagnostic's epsilon-vertex early-skip decisions. No coordinate welding, perturbation, float export/reimport, geometry repair or JS classifier.

First objective: show the notch point/edge contacts are discoverable as geometric contact beyond permitted native incidence, while ordinary shared triangulation edges/vertices are allowed. This is a diagnostic test, not yet a certificate. Checking only nonincident triangle pairs also cannot rule out extra contact between pairs that already share a vertex/edge.

A defensible future certificate needs a native predicate establishing for **every relevant triangle pair** that geometric intersection equals its permitted topological intersection, including adjacent pairs, with robust/certified arithmetic and bounded work. An initial explicitly declared orthogonal boxed-CSG domain may be supportable after proving that property's coverage and numerical domain; arbitrary warps/rotations/meshes remain unqualified. Existing IsSelfIntersecting is insufficient because it skips near-coincident vertices by position and ignores marginal contacts. If no trusted native routine can establish that predicate, retain JOIN_UNQUALIFIED rather than grow an ad hoc classifier or declare all one-component outputs good. This follow-up is not implemented or claimed in this checkpoint.

No filesystem race/security tests, private state, services, relay, deployment or browser execution in this lane.
