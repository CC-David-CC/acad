# Public concentric workflow and signed driving dimensions

Source preparation only. This checkpoint has not been compiled or executed in a browser. Root will compose the Core and Desktop adapter, freeze the runtime and run the complete workflow once. Existing evidence remains unchanged.

The confirmed source gap was that `SignedDistanceX`/`SignedDistanceY` could be created but discovery advertised neither an editable locator nor removal. Existing dimension edits reconstructed only one target and required a positive value. The shared Worker path now resolves the **ordered pair of actual inspected point identities** and changes only its `distance` constant. X means `point[1].x-point[0].x`, Y the corresponding Y difference. Both accept canonical millimeters in [-1,000,000,+1,000,000], including zero. Segment length and diameter retain their positive domain. ProjectedDistance remains explicitly unsupported.

There is one existing transition/replay/publication/journal path. No constraint is removed/re-added to simulate an edit; actual removal is a separate existing public action. The candidate and independent verifier retain the original source membership, constraint order/annotations and unrelated intent. The existing sketch-byte journal classifies the new two-target dimension delta; it needs no new journal kind or alternate model. Public locators remain opaque and revision-bound. Named dimensions use the existing typed physical-quantity document/evaluator. Signed X/Y fields explicitly consume typed **length** values with their signed domain. A currently named driving dimension rejects numeric replacement (`BOUND_DIMENSION`); parameter edits or explicit named replacement preserve provenance. Angle/unknown names and other unregistered fields remain unsupported. No new solver or Concentric admission rule is introduced.

`example.mjs` takes the real `createCadAgent` for one explicitly selected window. Its build uses only public commands: anchored 10x10 datum rectangle; Circle A(40,20), radius5; Circle B(45,25), radius3; unrelated Point(7,9); ordered X/Y locks to A; independent diameters10/6; then Concentric. Canonical point rows are derived once by the real inspection Worker, and the transition Worker independently derives its own rows from the same captured source; the target/classifier stays pure and legacy callers without rows cannot advertise signed targets. Point IDs come from actual public inspection and parent ownership, curve IDs from accepted append receipts corroborated by inspection. No source/model injection, ID grammar parsing, guessed constraint IDs or private actions.

`desktop-driver.mjs` composes that example with the retained signed harness. It pins every actual inner asset and outer index and records producing recipe/helper source hashes separately from runtime source identities. Its intended complete acceptance is:

- Concentric follows independently fixed A, preserves distinct radii and unrelated Point; real creation Undo/Redo restores the previously authored snapshot.
- Ordinary positive rectangle length remains editable; zero/negative length and diameter refuse without changing accepted source/history/journal/resources.
- A signed X40→50 and B diameter6→8, with mixed creation/edit travel; incompatible B-center edit refuses atomically.
- Signed X and Y edits through zero and negative values; actual signed-X removal and journal travel. After removal, the free X coordinate is deliberately not prescribed by the oracle.
- Actual length definitions bind X/Y; numeric overwrite, angle name and unknown name refuse. Definitions then drive zero/negative values with travel.
- Normal native Save, browser/server byte readback, fresh login/Open, named-parameter and diameter reedit, mixed travel, resave and a second fresh Open. Actual authored sketch bytes/IDs/definitions/history/counters are compared, and the session-local journal must reset on Open.

The equation oracle checks independently authored expectations against both public canonical point measurements and detached saved source: ordered signed differences, concentric center equality, independent radii, unchanged rectangle and Point. Admission/residual data corroborates these checks and is not the truth oracle. Coordinate/radius absolute tolerance is frozen at 1e-6mm. The driver requires no native solid, and makes no BRep or whole-constraint-system completeness claim.

A reversed duplicate Concentric is **not** claimed as a no-op: the current transition contract appends one actual relation. No workaround or speculative change is included. Typed-document mutation scope remains existing driving-dimension edit/removal plus the existing typed-parameter transaction; no new generic typed point/constraint creation API is implied. Browser focus/UI usability, all other constraint schemas, and complete Gate1 signoffs stay separate.

Run only after root provides a composed runtime and private signed fixture. Both repositories must have the frozen source available. `CODI_DESKTOP_SOURCE_ROOT` points to the producing Desktop checkout containing the real helper and harness; it need not be the served Desktop commit. Keep those identities distinct in custody records.

```sh
CODI_DESKTOP_SOURCE_ROOT=/path/to/frozen/desktop \
CODI_SIGNED_PINS=/path/to/runtime-pins.json \
CODI_EXPECT_SOURCE=EXACT_CORE_COMMIT \
CODI_EXPECT_DESKTOP=EXACT_RUNTIME_DESKTOP_COMMIT \
CODI_TEST_URL=http://127.0.0.1:ROOT_ASSIGNED_PORT/ \
CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_EVIDENCE=/tmp/codi-concentric-signed-r1 \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
/tmp/codi-files-move-node/bin/node test/concentric-public-workflow/desktop-driver.mjs
```

Use a fresh evidence directory; the first failure is retained before cleanup. The driver owns only its fresh account/browser contexts. It disconnects from the shared browser and leaves root's fixture running. No deployment, filesystem-race probe, Native rebuild or service change belongs to this workflow.
