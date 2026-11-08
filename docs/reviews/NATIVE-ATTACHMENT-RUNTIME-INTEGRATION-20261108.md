# Native planar attachment runtime integration

Source-only integration branch `integrate/native-attachment-runtime-20261108`,
based on main `2e14280ec1129a83c453d06036aaabc7e01f9c50`.
This packet depends on the separate in-progress native-face Phase B product;
it is not independently runnable or qualified and must not be merged alone.

Only the explicitly selected OCC shell cohort advertises
`planarAttachmentVersion:1`. Its existing native JS/WASM pair is unchanged.
The mount supplies `planarAttachments:true`, the exact request/observation
captures and the finite reason vocabulary to the shared Worker controller.
The init flag remains `planarAttachments:1`; the exact descriptor is
`solid.face.frame.read` v1, input `owned-source-bound-last-cap-v1`, output
`owned-planar-attachment-v1`, 4096 metadata bytes, zero native-result cost,
qualification `workflow-unqualified`. Catalogue validation rejects this
operation on cohorts without the capability. Runtime geometry/selection
ownership and currentness remain the controller/ledger/Worker's authority.

The shell stager, webpack entry and catalogue mount explicitly include exactly
`nativePlanarAttachmentFacts.mjs` and `ownedPlanarAttachmentProtocol.mjs` in
addition to their previous closed module set. The facts module imports only
the protocol. Existing closure, colocation, byte/hash, immutable-source and
manifest guards remain unchanged. No broad resource allowlist is introduced.
Neither the preferred backend nor any other cohort acquires this capability.

Integration still required before the next normal build:

- Freeze/review and compose the dependent Phase B product and full workflow.
- Calculate the actual composed `oci-verified-worker.js` SHA and refresh all
  existing explicit bootstrap pins; do not weaken bootstrap verification.
- Regenerate every affected native graph from fresh outputs using the normal
  build procedure. Old cached manifests must never be edited to appear fresh.
- Run the complete native-face attachment workflow in Chrome, retain its first
  failure, and run the independent artifact oracle after the whole workflow.
- Record actual runtime/host commits, source hashes, lifecycle and refusal
  evidence before making any qualified capability claim.

No build, test, browser execution, public deployment or native ABI change was
performed for this source-only packet. This is a required dependency of C08
Phase B, not another Gate 1 pass.

## Composed source checkpoint

Root candidate branch integration/native-attachment-candidate-20261108 now
composes product3536e49 as c5077a6 with runtime285ac13 as4f0050d over
main62cbf2b. The only content conflict was additive Craft imports; both sets
were retained. Actual common Worker SHA256 is
12bc1ab499f3c4d6616ba5ed736f6c29f7ec7a62e48e8a02b4f104e701b024a9.
All eight existing explicit build-only bootstrap pins now match those actual
source bytes. Historical evidence is unchanged. Native JS/WASM pairs, default
backend and other cohort capability declarations remain unchanged.

The complete Phase B driver/example/oracle packet is still pending. No build,
test or browser execution has been performed for this composed native-face
candidate. Fresh native graph regeneration, matching Desktop transport and
whole-workflow proof remain required before qualification or main integration.
