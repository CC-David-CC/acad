# Shared generic OCC build comparison — bounded PASS

This compares the retained default OCCT builda84/07d and the selected-owned
buildcbd/a81 through their **registered shared generic** box/Boolean interfaces.
They are two builds/adapters of OCCT, not independent geometry kernels. Every
result is checked against its own analytical expectation and an independent
Node calculation over the transferred Float64 triangles; agreement between the
two builds is not treated as proof by itself.

Source base `6f01a09fea5c75beba9297772edd50ff37b1b2a4`. No product, engine catalog,
geometry revision, native binary, default selection, history or app changes.
Actual classic Worker assets: retained default6189 and selecteddd60, with unchanged
native JS/WASM. `receipt.json` records full asset hashes and byte lengths.

## Same-input correctness matrix

A is a10×10×10 box at the origin. `cases.mjs` specifies each B and independent
volume/bounds/solid-count contracts. These are solid-domain results; an explicit
unsupported lower-dimensional result would have been recorded as partial,
never fabricated as an empty solid. All cells actually return supported results.

| B arrangement | Default union | subtract | common | Owned union | subtract | common |
|---|---|---|---|---|---|---|
| Disjoint |PASS|PASS|PASS|PASS|PASS|PASS|
| Overlap |PASS|PASS|PASS|PASS|PASS|PASS|
| Contained |PASS|PASS|PASS|PASS|PASS|PASS|
| Coincident |PASS|PASS|PASS|PASS|PASS|PASS|
| Face contact |PASS|PASS|PASS|PASS|PASS|PASS|
| Edge contact |PASS|PASS|PASS|PASS|PASS|PASS|
| Point contact |PASS|PASS|PASS|PASS|PASS|PASS|

42/42 cells pass. Independent Node triangle integration and extrema agree with
analytical volumes/bounds. Genuine empty common/subtract results have zero
mesh volume/no display coordinates; disjoint and edge/point unions preserve
multiple native solids. Native validity/classification remains the provider's
observation. No equality of face/edge partitions or tessellation order is
required between builds. Face-contact union allows equivalent solid partitions;
its measurable volume/bounds and input preservation remain mandatory.

Both inputs are reread after every Boolean and independently checked against
their original box definitions. Authored input values remain unchanged. Every
issued handle is explicitly disposed, rejects stale use, and its Worker is
terminated. These results do not claim global manifoldness of a welded mesh for
point/edge-touching multi-solid compounds.

## Repeated work and lifetime controls

Each build also creates a40×20×5 plate and three distinct3×4×5 through-cut tools.
The successive expected volumes3940,3880,3820 and unchanged outer bounds pass.
The original4000-volume input remains readable afterwards. This uses7 native
names, staying within the older8-name scope rather than raising either limit.

A separate genuine native1000-volume result is held through cancellation for
each build. Cancellation returns CANCELLED, late original delivery remains
inert, retry returns MOUNT_CLOSED, and the Worker terminates. No artificial
successful envelope, UI, native-file seed or private geometry writer is used.

All46 observed Workers terminate. Selected-owned explicit disposal confirms
native names return to0. The default's native owned-name count is unavailable;
its wrapper handles return to0, while its disposal descriptor remains
logical-only. Native release is **not inferred** from that wrapper count.
The default retains5 interpreter argument pointers per Boolean cell (4 in the
repeated-cut case) until Worker termination; selected-owned retains0. Pointer
count is not allocated bytes or total native memory.

## Single-run cost observations

| Observation | Default | Selected-owned |
|---|---:|---:|
| Matrix initialization median ms |507.3|508.4|
| Matrix Boolean median ms |113.1|105.1|
| Sum21 Boolean wall times ms |2371.7|2365.2|
| Matrix Float64 geometry bytes transferred |91584|91584|
| Matrix Float32 display bytes transferred |45792|45792|
| Matrix observed WASM capacity |16MiB|16MiB|
| Three-cut sum Boolean wall ms |471.6|453.1|
| Three-cut geometry/display bytes |12096/6048|12096/6048|
| Three-cut observed WASM capacity |24248320|16777216|

Initialization covers fresh Worker realm setup/fetch/hash/instantiate, not a
controlled cold-browser start. All default cells precede owned cells, so cache
and scheduling/order effects are not separated. These single-run observations
do not establish a speed advantage or a benchmark distribution.

Buffer counts include actual mesh reads for result and input-preservation checks;
repeated reads transfer again. Independent test oracles copy small box meshes
into Node for verification. Product rendering/persistence does not use those
Node copies. WASM capacity is not allocator-used bytes, JS heap, process RSS,
peak whole-browser memory or reclaimed OS memory. The repeated-cut capacity
difference is observed; its cause was not isolated and is not labeled a leak.
Old missing nativeVolume/nativeBounds facts remain absent/unknown. The default
mesh integral is not relabeled an independently measured native volume.

## Interpretation and next decisions

No concrete product failure appeared in this bounded shared generic corpus.
The owned build is a credible candidate for a **future new-part** policy after
current public capacity/host gates: it matches these measurable generic results
and offers confirmed release, native observations and the separately qualified
selected-profile capacity. The data provide no reason to silently change an
existing authored engine revision. Current default-first box then selected
creation remains an explicit incompatible-build refusal, as qualified elsewhere.

This does not qualify all curved geometry, legacy rectangle/hole/enclosure
workflows, STEP/3MF interchange, source/history edits, signed My files, physics,
large models or a new default. It does not repeat the NVIDIA kernel investigation.
Current capacity/signed integration decisions stay with the root lane; this
comparison makes no automatic promotion.

## Reproduce

Retained R730 stage `/mnt/data10tb/codi-occ-generic-comparison-20261106-r1`,
loopback20710. It archives the stated source and copies the exact runtime dist
from `/mnt/data10tb/codi-cad-selected-profile-capacity-combined-20261106-r2`.
The blank component page is served under strict same-origin scripts/Workers and
WASM-only evaluation, with no general unsafe-eval or blob Worker allowance.
All observed CSP violations are checked empty.

Serve dist/modules→../modules and dist/occ-comparison→this staged directory.
The two diagnostic classic Worker wrappers only import their exact registered
production bootstrap and add read-only counters; no geometry or budget override.
Use the existing strict serve-craft-detach-fixture.py on a NEW loopback port for
future reruns. Supply loopback JSKETCHER_TEST_URL/CODI_TEST_CDP, reviewed
PUPPETEER_CORE_PATH and a new CODI_RECEIPT to `browser.cjs`; optional
CODI_COMPARE_CASES selects named cases. The driver closes only its own context
and disconnects shared Chromium. Source/tests/pins/evidence are backed to both
LANs; no account or service state is required or copied.
