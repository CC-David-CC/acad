# Research rectangle-prism semantic provenance

`deriveRectanglePrismRoles(featureId, profile, result)` is a data-only research
operation intended for a Worker. Its version-1 manifest carries the exact
feature ID, authored revision, sketch digest, face and canonical region, plus
the actual mount-owned engine handle as **attribution**, not a durable ID. The
caller must assert the live mount/descriptor binding both before and after the
job and must separately check document, account, feature and revision lifetime.
This module cannot authenticate a caller-supplied handle. Nothing here publishes
or serializes a CAD model.

Each record pairs a structured semantic key with a response-local topology
token. The key includes the authored feature ID and is either a BASE/LID face
with the complete region ID, or a SWEEP face / BASE or LID perimeter edge with
an authored global segment ID. The response-local token is only a locator in
this one topology result. Four connector edges and all vertices remain explicitly
unsupported: their endpoint identities are not yet qualified. No rounded
coordinates, native pointers, face ordinals, arbitrary first segment or legacy
string concatenation form durable semantic keys.

The operation revalidates the captured authored profile/digest and exact region
source set, checks its bounded mount envelope against worker ancestry, and uses
the strict headless prism reader for supported geometry and oriented incidence.
It finds the unique common base, four distinct swept sides, opposite lid, and
one lid edge per side; ambiguity fails closed. The reader currently accepts its
narrow direct-plane/two-triangle-per-face subset. A successful derivation is not
proof that the mount or document is still current.

The real strict-CSP browser test runs a production sketch Worker, the pinned
OCC Worker through the verified mount, and this separate no-Verb semantic
Worker. It checks 100→150 mm width edits, reordered/reversed **solver output**,
14 distinct stable structured keys with changed revisions/digests, four
explicitly unsupported connector edges, and malformed source/region/ancestry/
orientation/engine inputs. It verifies the mount binding before and after each
job. Another actual authored/solved 100×50 example uses the same four segment
IDs as the retained legacy OCC browser run in
`test/webos/rectangle-creation-evidence-20261104.json` (SHA-256
`b45afb16a41549e1281e3c7e2b57ac951338df282c00677290ff2cdb8aefa369`,
`plate-fillet-pattern-browser`, source `07316f8f56e334316a270d3ec0ae4f804ac24dec`).
Its four observed `E:LID[segment]` names agree with the new four LID-edge role
and source associations. The retained legacy run also shows `F:LID[...]`.
`FromSketchProductionAnalyzer` assigns BASE/LID faces from the locale-minimum
contour segment and SWEEP faces and BASE/LID edges from segment IDs. The new
region-based face keys intentionally **do not** claim equality with those
legacy string IDs; the legacy receipt does not independently qualify every new
role, and the old analyzer's inferred endpoint/connector labels are not used.

Use the isolated engine fixture described in `test/engine-extrude/README.md`,
built from this branch so it includes `portable-topology-envelope.mjs`. Build
`test/prism-semantic/webpack.config.cjs` with the existing CSP-safe numeric
module, copy the resulting Worker to `static/prism-semantic-worker.js`, and run
`browser.test.cjs` with the documented loopback Chromium/Puppeteer setup.
This is not a persistence-format or public command change.

Lead integration `be70f127` passed a fresh semantic Worker build, TypeScript
checks and the actual strict-CSP browser workflow on the combined reader/mount
tree. `lead-evidence-20261104.json` binds the exact source, fixture assets,
commands and limitations. Independent review also passed the scoped workflow.
This qualifies the structured roles for the supported rectangle result; the
model projection and guarded resource/history publication remain unfinished.
