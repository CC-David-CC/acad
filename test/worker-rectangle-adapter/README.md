# Bounded authored rectangle to worker-owned prism adapter

`runWorkerRectangleExtrusion` is a private research adapter, not a craft
operation or public command. Its input is an exact record containing
`evaluation` (the existing candidate owner), string `featureId`, captured
versioned authored `profile`, `bodyPolicy:'separate'`, `booleanKind:'NONE'`,
`occupiedIds:Set<string>`, trusted `assets`, synchronous `valid:()=>boolean`,
and optional `signal`. Profile identity is the authored face/region, revision,
SHA-256 digest, exact sketch JSON, frame and positive depth. This slice accepts
OCC/millimeters, one closed supported rectangle and at most 65536 sketch UTF-16
code units. Unsupported profile geometry/frame is validated in a data-only
Worker before allocating an OCC mount; unsupported Boolean/body/engine and
invalid package paths are rejected even earlier. There is no BOX substitution,
implicit conversion, DOM, canvas, or kernel call in that computation.

The adapter acquires one owner-managed, lazily created verified OCC mount,
requests its research topology, checks the exact live source/handle association,
then runs the strict reader and semantic derivation in a second dedicated
Worker. Its client uses a distinct origin Web Lock, at most two outstanding
jobs per module, a total 30-second deadline, cancellation and termination;
the semantic Worker caps its serialized response at 64 KiB. It then performs
the already bounded 8/12/6 JS model projection, checking all candidate registry
IDs and rejecting any durable ID over the native project's 1024-character
limit. The result is `{model, requireCurrent}`; no native pointer or worker
handle is placed in the model. Calls to `requireCurrent` are candidate-phase
precommit checks. The adapter also registers a bounded owner publication check
that rechecks host/source validity and `mount.assertPortableBinding` immediately
before later candidate steps/commit without recursively calling the owner.
The check captures no permanent geometry identity; owner close disposes the
mount. Any adapter failure closes its candidate mount, so an evaluation must
fail rather than continue with its earlier mount results. Actual native cleanup
is whole-worker termination, not fine-grained allocator reclamation.

The caller must supply a `valid` guard covering exact captured document,
sketch bytes/frame/region, storage/expression/history revisions, account and
window lifetime, and must recheck the final candidate registry for collisions
introduced by later operations. The candidate owner and host must be current at
every await and publication; acceptance/old-owner retirement belong to craft.
The model tag does not by itself gate legacy consumers or transient connector/
vertex references. The explicit representation and reference gates must exist
before any live publication. Save/reopen must persist authored history only.

Packaging needs a trusted pinned OCC bootstrap Worker and its app-local sibling
modules `rectangleProfileRequest.mjs`, `authoredRegions.mjs`, `profilePlan.mjs`
and `profile-topology.mjs`, plus the already pinned `occ-portable.js` and WASM.
It also needs a bundled same-origin `prismSemantic.worker.ts` using the
CSP-safe numeric build; no Verb/DOM shim is required. The controller/envelope
module is bundled with the host adapter; all scripts and dependencies require
closed-inventory and CSP review. URLs here are trusted application configuration,
not authored project data. No package pins or deployment are changed.

`browser.test.cjs` uses the actual pinned production sketch Worker and OCC
runtime, the root `e8270159` evaluation resource pool/publication checks, and
the actual semantic Worker under strict CSP. It checks independent bounds and
50,000 mm³ volume, a real 100→150 width rebuild with stable supported IDs,
same-owner mount reuse across two features, owner seal/accept, source validity
loss after return, semantic cancellation and validity loss during work,
non-Boolean/non-XY/path refusal before OCC allocation, and real authored IDs
that would produce a >1024-character durable reference. Build the two test
bundles with `webpack --config test/worker-rectangle-adapter/webpack.config.cjs`;
use the isolated fixture preparer and pinned inputs in
`test/engine-extrude/README.md`, copy `entry.js` and `semantic-worker.js` to
`static/rectangle-adapter-entry.js` and `static/rectangle-semantic-worker.js`,
and run the browser test with loopback Chromium/Puppeteer. Its test entry only
exposes the adapter and the real pool to the browser; it does not substitute a
model, kernel, Worker, or owner implementation. This is not proof of craft
history, edit/undo/save, current host authorization, or a deployed feature.
