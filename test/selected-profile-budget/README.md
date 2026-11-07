# Selected-profile capacity review — bounded evidence, no product promotion

Base source `15b9607a7880eeb7cf98f9de40a3563d19a3c5a6`; no product edits.
Actual normal app SHA `01f3eee8e2e0d0ccee253a33af40d47b704f04015b7f992e20a04f44ab0e27e6`.
R730 owned stage `/mnt/data10tb/codi-selected-profile-budget-20261106-r1`, port20705.

The unchanged mount controller has `maxLifetimeNames:8`, and its `reserve()`
refuses when the cumulative counter reaches8. The production Worker independently
has `maxNames=8` and refuses its ninth name before native creation. Neither
counter is restored by disposal. The native owned-name map counts live shapes;
disposal erases the entry and confirms count reduction. Selected-profile-v2
uses owned string keys/RAII and does not retain legacy DRAW argument pointers.
The native map itself has no eight-entry guard.

`component.cjs` uses the actual mount/controller and pinned production Worker/JS/
WASM. Its private wrapper only imports the production Worker, delegates all
geometry messages unchanged and exposes read-only diagnostics. A blank page
hosts the component; there is no Canvas, solver double, model seed or fake UI.
The production Worker resolves planner/display modules relative to its Worker
URL: the first wrapper run lacked aliases and failed. Its raw receipt/log are
retained. The fixture now aliases the identical production planner/display
modules into the diagnostic directory; no geometry/source/asset changes.

Baseline outcomes:
-8 simultaneous mixed rectangle/disk/annulus outputs succeed with independent
  native volume checks, input preservation and measured buffer sizes.
- Controller ninth creation returns RESOURCE_LIMIT. Existing input remains valid.
-8 create/dispose cycles, peak one live shape, also exhaust the lifetime budget.
- Direct unchanged Worker protocol independently refuses ninth at allocateName.
- Native live names return to0 after disposal; lifetime remains8; selected
  retained-interpreter-argument pointer count stays0.
- Observed WASM linear-memory capacity remains16,777,216 bytes throughout each
  bounded8-case corpus. This is capacity, not allocator usage, JS heap or RSS.
- Actual normal public Circle APIs author9 disjoint regions. The first8 selected
  features succeed. Ninth full replay returns RESOURCE_LIMIT, committed:false,
  preserving accepted source/version/history/models/native measurements.212
  observed Workers terminate; final pool has0owners/0mounts/no cleanup failure.

The public ninth operation spends about6.5s replaying accepted earlier features
before its late refusal in this run; wall time includes Worker initialization,
geometry, IPC and scheduling, not measured CPU time. These figures are a single
fixture observation, not a benchmark distribution.

Current public selected discovery advertises sourceBytes65536, regions128 and
responseBytes65536, but does not expose the native operation/name budget or its
remaining allowance. Generic engine capabilities expose maxDisplayTriangles
100000, not lifetime-name capacity. The underlying mount descriptor exposes8,
but that descriptor is not the public selected command discovery surface.

## Separately labeled PRIVATE32 experiment

`stage-experiment.py` copies the source-pinned mount module graph into a private
qualification directory and replaces exactly `maxLifetimeNames:8`→32 and
`if(next>=8)`→32 in its controller. The source and generated controller hashes
are recorded in `evidence/experiment-staging.json`. The separate
`diagnostic-worker-32.js` imports the same production Worker and sets only its
lifetime-name ceiling to32. Native JS/WASM, geometry messages and operation
implementations remain unchanged. Generated product copies are not committed
and are never imported by the public app or a catalog/default mount.

Both32 simultaneous profiles and32 create/release cycles succeed. The33rd
controller/direct-Worker requests refuse, native names release to0, lifetime
remains32 and selected retained-argument pointer count stays0.

| Single-run observation |8 live profiles|32 live profiles|
|---|---:|---:|
| Initialization wall ms |560.3|556.9|
| Sum creation wall ms |576.8|1826.8|
| Median creation wall ms |63.6|61.8|
| Sum mesh-read wall ms |256.5|946.0|
| Cumulative returned triangles |1428|6388|
| Transferred Float64 coordinate bytes |102816|459936|
| Transferred Float32 display bytes |51408|229968|
| Observed WASM capacity |16MiB|16MiB|

A more representative32-operation component case builds a120×80×5 plate,
15 radius2 through-hole tools,15 successive native subtractions, and one
separate coupon. Tools and intermediates remain owned. It passes native validity,
solid count and independent final volume `48000−300π =47057.52220392308`, with
21 faces and1992 final display triangles. Original plate volume48000 and first
tool20π remain readable after all Boolean work and the refused33rd request.
All32 native names release and owning Workers terminate.

That run totals4038.1ms creation/Boolean wall time and18016 cumulative mesh
triangles, transferring1,297,152 Float64 bytes and648,576 display bytes through
the measured mesh reads. WASM capacity stays16MiB. This is a native component
corpus, **not** a32-feature public/parametric/save qualification. Initialization
is not controlled cold startup; browser compilation/cache/scheduling effects
are not separated. Buffer counts describe returned/transferred buffers, not
retained JS heap, transient native allocations or process RSS. Capacity remaining
16MiB after disposal does not imply16MiB used or a leak, and name count0 is not
an allocator/OS-memory-reclamation claim.

## Bounded policy recommendation for root review

1. Qualify a selected-profile-v2-specific ceiling of32 native results per owned
   evaluation mount, retaining monotonically increasing lifetime names and
   explicit native name release. Keep8 for legacy/other unqualified adapters.
   Never change the shared constant globally: legacy DRAW profile paths retain
   argument allocations and have different temporary-name costs.
2. Count actual native operations across the history: profiles, boxes, Booleans
   and any named temporary outputs. A tool and its subtraction cost two names;
   32 human-visible features need not cost32 names. Current owner/mount scope
   spans the evaluated document/runtime, not a new independent quota per body.
   Each new full replay owns a fresh generation; do not replenish the same
   realm's lifetime quota by disposal or silently restart midway through history.
3. Start qualification with the existing100000-triangle limit as an **aggregate
   per-evaluation returned-mesh budget**, not32 independent allowances of100000.
   This bounds measured coordinate/display transfer totals to7,200,000 and
   3,600,000 bytes respectively. It does not bound native/JS heap or total RSS.
   Keep existing source/region/face/native-validity domains and30s per-request
   timeout; preserve accepted ownership on every refused/aborted candidate.
4. Public discovery must report scope, maximum authored native-result budget,
   current planned cost and append allowance. Preflight impossible append costs
   before replay: the observed ninth refusal needlessly repeats earlier work.
   Keep readonly discovery/save available at capacity. Numeric edits/undo of a
   supported existing history can still replay within the same total budget.
5. Do not infer a larger native heap policy from these simple shapes. The current
   module starts at16MiB and allows growth; its generated resize helper uses the
   2GiB Emscripten32-bit ceiling. No actual native allocation count or RSS was
   measured. A heap-capacity postflight check is only an acceptance guard, not a
   hard peak-allocation ceiling. A hard lower WASM maximum requires its own
   source-pinned runtime/build policy and qualification, not a false memory claim.
6. Before product promotion, run actual public32-operation authoring,33rd
   preflight refusal, full-capacity depth/source edits, authored travel, signed
   save/reopen, cancellation, stale/lifetime/post-commit controls and cleanup.
   Add more demanding supported Boolean/mesh cases and measure whole-replay time
   before setting an overall replay deadline. None of those public32 gates is
   claimed by the diagnostic cap experiment.

This is evidence for a modest **selected-runtime-only** capacity candidate. It
is not a reason to remove bounds, accept arbitrary32-feature complexity or
switch the default/native build. Root retains product/integration ownership.

## Reproduction

Archive the stated CAD source into a NEW R730 stage. Copy the exact combined
runtime dist from `/mnt/data10tb/codi-cad-selected-profile-combined-20261106-r1`
into that stage (verify its combined-pins.json first). Copy this directory's
qualification scripts. Serve `dist/modules` as a symlink to `../modules` and
`dist/budget-review` to `../test/selected-profile-budget`. The diagnostic directory
needs `selectedProfilePlan.mjs` and `displayProjection.mjs` aliases to the exact
dist/static modules because production Worker dynamic imports use its own URL.
Run the existing strict `test/enclosure-history/serve-craft-detach-fixture.py`
against dist on a new owned loopback port. No account/service state is involved.

Run `stage-experiment.py --root NEW_STAGE` only to generate the separately
labeled private32 mount graph; it refuses an existing target directory.
All browser drivers take loopback `JSKETCHER_TEST_URL`, `CODI_TEST_CDP`, reviewed
`PUPPETEER_CORE_PATH` and a new `CODI_RECEIPT`. `component.cjs` is the unchanged8
baseline; `component-32.cjs` and `mechanical-32.cjs` are explicit experiments.
`public-nine.cjs` uses the untouched normal public app; `discovery.cjs` records
actual public capability fields. Each driver closes its own context and only
disconnects from shared Chromium. No generated binary/product graph is checked
in; source, hashes, logs and receipts are backed to both LANs.
