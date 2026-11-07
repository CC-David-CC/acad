# Manifold strict-Join investigation

Scope: actual pinned source-built Manifold JS cd2031fd… / WASM7bb5f8ee… in Node, with typed API inspection and independent construction arithmetic. No new Worker/browser/public Join test or production source change. The existing application runtime remains unchanged. All owned native wrappers are explicitly deleted; no heap benchmark is claimed.

23 native observations are retained separately:

- observe.mjs / evidence/decomposition.json:14 cases. Ordinary overlap/face unions have one positive component; edge/point/disjoint unions have two. Cavity is[1000,-8], two cavities[1000,-1,-8], through-hole[960], cavity+island[1000,-8,+1]. The native warp diagnostic (not a current public operation) can retain NoError/one positive component while distinct nonadjacent unmerged topology vertices coincide at an integer position. Signed component counts are not a general geometric-validity certificate.
- relationships.mjs / evidence/relationships.json:5 cases. Within an outer30³ box, two disjoint, point-touching and edge-touching10³ voids all report NoError/volume25000/one positive+two negative components. Native minGap between the two negative components distinguishes disjoint/touching here, but that does not establish general nesting. Attempts to invert a negative shell with ordinary Boolean operations do not produce the desired positive bounded interior; those actual results are retained, not used as proof.
- exterior-contacts.mjs / evidence/exterior-contacts.json:4 cases built ONLY from currently admitted translated boxes and native Booleans. A30³ outer minus a corner notch[-1,-1,-1]–[10,10,10], then an internal10³ cube, gives proper cavity[12,12,12], exterior point-contact[10,10,10] and edge-contact[10,10,5]. All report NoError/25000/components[+26000,-1000]/genus-1/public minGap0. A face opening becomes one component. Thus existing status/decomposition/sign/gap observations cannot establish the requested strict boundary property even on the current construction path. These are counterexamples to that proposed diagnostic rule, not claims that the native library violated its own topology/epsilon contract.

api.mjs records actual instance prototype methods. Public JS exposes decomposition, status and solid minGap, but no geometric boundary self-contact certificate. The first relationships attempt incorrectly used a zero-argument JS Manifold constructor; the JS binding expected mesh input and refused before any case. Original source and failure receipt are retained as relationships-before-empty-constructor.mjs/json. Corrected source obtains a genuine empty by native self-subtraction. This was a probe API assumption, not a kernel defect.

The pinned public [Manifold::MinGap implementation](https://github.com/elalish/manifold/blob/31afd71d17c7a94cfaeada83f657d7b42628ead6/src/manifold.cpp#L908) returns zero when its Boolean intersection is nonempty, explaining the proper nested-cavity result. The existing private [Impl::MinGap](https://github.com/elalish/manifold/blob/31afd71d17c7a94cfaeada83f657d7b42628ead6/src/properties.cpp#L408) uses native triangle-boundary distance, so a read-only boundary-only exposure is a bounded next diagnostic. Native [Is2Manifold and IsSelfIntersecting](https://github.com/elalish/manifold/blob/31afd71d17c7a94cfaeada83f657d7b42628ead6/src/properties.cpp#L104) also exist; the latter skips near-coincident vertex pairs and tests displaced triangles, so merely exposing it is not a strict self-contact certificate. The [library's documented distinction](https://github.com/elalish/manifold/wiki/Manifold-Library#manifoldness-definition) between topological and geometric validity remains relevant.

Approved next slice, not implemented in this checkpoint:

1. Separate native Manifold fork/branch at pinned31afd71d…, preserving existing runtime/source. Add read-only methods in include/manifold/manifold.h, src/manifold.cpp, bindings/wasm/bindings.cpp exposing existing native boundary distance and topology/self-intersection diagnostics plus tracked epsilon. Reuse native double geometry, BVH and predicates; no Float32 re-import, vertex welding, tolerance change or JS geometric classifier.
2. Qualify proper versus touching cavities and native topology diagnostics on the exact new binary; keep every observation named as a diagnostic. A final connected-domain/self-contact certificate still needs the topological-adjacency requirement. No universal success from one positive component or from the existing self-intersection boolean.
3. Only after a sufficient native proof exists should separately approved Worker/controller/metrics/policy wiring capture it by exact handle/build and advertise a qualified Join capability. Likely files: manifold-verified-worker.js, its worker-mount response capture, solidMetrics.mjs and solidResultPolicy.mjs, plus root-owned explicit catalogue/staging pins. Current Manifold JOIN_UNQUALIFIED remains correct until then. No OCCT/revolve files are part of this lane.

Run probes with an exclusive output file and exact existing assets:

```sh
CODI_MANIFOLD_GLUE=<byte-identical-glue.mjs> CODI_MANIFOLD_WASM=<retained-manifold.wasm> CODI_OBSERVATION=<new.json> node test/manifold-join-investigation/observe.mjs
node test/manifold-join-investigation/check-observed.mjs
```

The second command independently checks23 observations and the retained probe failure. Raw observations are immutable. Binary inputs stay outside Git. No foreground/shared browser, app/file services, relay, deployment or filesystem-race work is involved.
