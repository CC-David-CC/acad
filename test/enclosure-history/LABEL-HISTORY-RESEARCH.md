# Inset-label authored history control

`WORKER_ENCLOSURE_V2` is a separate operation with persisted label width, length and depth in millimeters. It creates a BODY, LID and LABEL as one checked result with `worker-enclosure:2:[featureId,role]` identities. Version 1 remains separate. This OCC-only display route does not make the worker shape editable through legacy face operations and does not qualify manufacturing export or physical printer fit.

`label-history-browser.test.cjs` uses a real strict-CSP Chromium fixture and OCC worker, with a trusted test host lifetime. It checks authored create, 100→120 mm edit, stable role IDs, undo/redo, native envelope replay into a fresh page, invalid edit after rewind, rejection at the accepted tip preserving history and exact display positions, the operation wizard through the existing test helper, and held-worker host-abort cancellation. The original v1 browser test is run separately. These tests do not use a signed desktop parent or claim Manifold authoring, complete CAD Gate 1, or actual printing.

Fixture source was based on f9c56e58 plus this history patch in `/mnt/data10tb/codi-enclosure-label-history-20261104`. The test-only webpack configuration sets `resolve.symlinks=false` and `devtool=false`; dependencies and previously built sketch/semantic workers are read-only links, with independently generated prism assets. `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1` was set. The actual served `dist/static/index.bundle.js` SHA256 is f77f4d6e1f0292aa54aa35a45a36008cdd44f69c93c4a4bd9fea0bb0f1ddff82; the embedded OCC worker input is 1e84ce9378ac276c6d85a410dac10a176d66692ca75a29d9e4d324a261162ba0 and OCC WASM is 13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2. This is a test build from source before commit, not a production package.
# Integration review

Functional combined-build rerun: root independently ran
`label-history-browser.test.cjs` against the exact `15a7e2a5` runtime, served
index SHA-256 `c35bce15493022ef28d0aa8b8d503f3bea4deeb980f4b1a3a8013e14515758bf`.
Create/edit/undo/redo, fresh native replay, rejected edits and in-flight
cancellation passed. Root also ran the real-pointer
`surfacing-push-pull-browser.test.cjs` on that runtime: one commit on release
and Escape preserving the prior distance passed. Each test used and closed its
own browser context; the shared functional fixture stayed running for signed
export and bracket tests. These runs do not themselves prove signed V2 3MF.

Integrated as `0731e605`. Root reviewed the versioned descriptor, detached label
parameters, three-role candidate publication check and stable model identities.
Six material-assignment controls pass alongside five display/lifecycle controls
using the documented webpack harness; TypeScript passes. A first direct Node
invocation of display.test.mjs could not resolve the repository's `lstream`
alias; the documented webpack command compiled and the resulting test passed.
This is not a claimed root rerun of the real-history browser test below.

Root export consumer `a6bbca25` accepts V2 grouping only with matching LID/LABEL
placement and a same-private-triple paired-planar contact proof. Its six mock
lifecycle controls pass. The native proof implementation and combined V2
export/signed persistence are pending, so this does not qualify a three-region
3MF manufacturing handoff.

