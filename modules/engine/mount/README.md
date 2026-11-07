# Research engine mount boundary

These prototypes are not connected to CAD or the desktop. The initial
`contract.mjs` adapter is also not worker-backed; the separate OCI experiment
below is. `contract.mjs` describes two adapter identities and exposes versioned,
data-only box requests and owned opaque handle responses. A fresh random mount
ID and generation bind handles to their owner. Closing invalidates handles;
engine resources remain private to the adapter. Unknown operations, foreign
handles, invalid units and invalid dimensions fail explicitly. There is no
conversion, automatic fallback or claim that OCC and Manifold are equivalent.

The caller must supply an already loaded, trusted runtime and an independently
verified runtime digest: the descriptor records that digest but does not verify
the code or WASM bytes. Manifold box creation uses the supplied library directly,
not the separate JSketcher Native BREP service. The older OCC SPI wrapper
contains box and dispose methods, but the selected source-built interpreter
does not expose their `_SPI_box` or `_SPI_dispose` functions. The prototype
therefore marks this SPI box unbound unless a trusted loader verifies exports.
The active application BOX instead uses the separate OCI command interface;
it is not mounted here. Both adapters are explicitly marked unqualified.
Deflection is a positive millimeter input used for OCC tessellation; it is
currently unused by the Manifold cube method. A caller must not interpret that
setting as an equivalent error bound. The resource pointer and renderer objects
are never part of a result.

`inventory.mjs` inventories wrapper method names and the bounded Native Mesh
integration, not the complete OCCT or Manifold libraries. `not-bound` means not
found in the named repository wrapper, not absent from the underlying library.
It intentionally uses `varies` and `unqualified` where individual UI and test
coverage is not established. Input/output schema entries are an initial
machine-readable vocabulary; detailed schemas, bound upstream library inventory,
full capability discovery and engine-specific families remain future work.

Cancellation is checked before and after the runtime operation; a late solid
is disposed on abort or close. It does not interrupt a running synchronous
kernel. `close()` does not wait for in-flight calls; callers must await them
before treating cleanup as complete. Runtime errors and malformed or partially
allocated engine responses require further resource-failure qualification.
No resource count, worker, memory, operation deadline, crash recovery, separate
thread, multi-window isolation or asset-custody guarantee is established here.
Do not use this prototype to publish results into authored documents.

Tests `contract.test.mjs` use controlled adapter doubles; these prove only
contract behavior, not kernel quality. `manifold-runtime.test.mjs` runs the
source-built CSP-compatible Manifold JS/WASM pair pinned by SHA-256, creates an
actual 10×20×30 mm box, measures 6000 mm³ and the expected bounds, and disposes
it. The wrapper captures those measurements solely as a test instrument. A
real Chromium run against the source-built interpreter confirmed that both
legacy SPI exports are absent and that this prototype refuses the operation.
The first attempted direct SPI box call failed with `engineFunc is not a
function`; it was retained as a diagnostic and did not exercise the current
OCI BOX path. A real OCC operation through this mount remains unimplemented.
Existing native-browser evidence in
`docs/WEBOS-REPRODUCIBLE-BUILD.md` does not test this mount prototype.

## Separate OCI worker experiment

`build-headless-wrapper.mjs` creates a research-only JS derivative from the
exact pinned `occt.js` hash `3c56e74e6e08411436a68fb930bab38aedd3137e4369af2bc67fd382e568787e`.
It changes only the appended exchange callback from `window` to `globalThis`,
removes its result logging, and yields JS hash
`4a53dec0dceb5715d070fa7293f6515ab681f6d3de979099526e616dbd052ddc`.
It does not recompile or modify WASM; use the pinned WASM hash
`a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb`.
The derived wrapper is a modified runtime artifact requiring its own source,
notices and reproducibility review; it is not the packaged app runtime.
The unmodified interpreter negative control fails with `window is not defined`
inside a real dedicated worker without DOM shims.

The separate `occ-worker-mount.mjs` and `occ-portable-probe-worker.js` provide a
single live box per mount: each box owns a dedicated worker and all internal
OCC names and C++ allocations remain in that worker. Disposal terminates it;
no pointer or name crosses the interface. The probe uses the actual OCI `box`
command, checks its return code, and derives bounds from triangle vertices. It
frees its own temporary command-argument allocations. OCC's interrogator itself
allocates C++ topology pointers and the legacy interpreter does not expose a
proven fine-grained free operation; this prototype relies on termination of the
entire worker, not individual OCC object disposal.

`occ-worker-mount.test.cjs` verifies in real Chromium under CSP with
`wasm-unsafe-eval` and without JavaScript `unsafe-eval`: exact JS and WASM
bytes via independent browser SHA-256, a 10×20×30 box with six faces, twelve
triangles and independently computed 0..10/20/30 bounds, foreign/stale/pending
handle refusal, abort, one-slot limit, and actual dedicated worker target removal
after dispose. The runtime digest in the mount descriptor remains caller-attested;
the separate fixture hash checks do not make the mount verify its own assets.
Termination proves that the browser target disappears, not immediate return of
all process memory. No arbitrary topology, multiple solids per worker, OCC
handle reuse, per-object free, multi-window/global admission, interruption
latency for a blocked kernel, source distribution, or production packaging has
been qualified. It does not provide CAD integration or representation
conversion. Packaging must use an independently verified manifest and asset
paths, a tested runtime build, and appropriate notices before consideration.

For this disposable loopback test, copy `contract.mjs`,
`occ-worker-mount.mjs`, `occ-portable-probe-worker.js`, and the derived JS as
`static/occ-portable.js` into an isolated app fixture; use an empty
`static/engine-test.html`, the pinned OCC WASM under its usual `lib-assets`
path, and run `strict-csp-server.py` with `CODI_ENGINE_TEST_ROOT` pointing at
that fixture. Then run `occ-worker-mount.test.cjs` against that loopback server
and a dedicated Chromium debugging endpoint.

## Verified multi-operation research mount

`oci-verified-mount.mjs` and `oci-verified-worker.js` are a separate experiment.
A version-1 manifest identifies the exact portable JS and unchanged WASM hashes.
The worker fetches same-origin assets without credentials or redirects, bounds
their sizes, hashes their actual bytes, and imports the verified JS bytes via a
temporary Blob URL while passing the verified WASM bytes to Emscripten. The
bootstrap worker, controller, expected hashes and manifest creation are trusted
inputs; this mechanism does not independently authenticate its own bootstrap or
host release. It requires `blob:` for worker script imports and
`wasm-unsafe-eval` for WASM in this isolated test CSP, while JavaScript
`unsafe-eval` is absent. No production CSP or application packaging is changed.

The versioned data-only API supports axis-aligned millimeter boxes and explicit
`common`, `union` and `subtract` between two distinct handles owned by one
mount. It does not convert engines or infer equivalence. Results refer to OCC
named shapes; body/solid count and connectedness are not yet
verified, so a nonempty Boolean result must not be treated as exactly one solid
for CAD publication. A zero-face result receives
`EMPTY_OR_NON_SOLID_UNSUPPORTED` while preserving its input handles; the adapter
does not claim that zero faces prove a valid empty solid. Such attempts still
consume one lifetime name. Requests capture their operation and handle identity
before asynchronous work; sparse, nonfinite and malformed vectors are rejected.
Handles are opaque and mount-scoped; disposal retires the logical handle but **does not free the native
shape**. An eight-created-name limit applies across the mount's entire life,
including disposed shapes. Whole-worker termination remains the only qualified
native cleanup boundary. The eight-name bound is a provisional test budget,
not an OCC limit. There is one in-flight operation and no queue: extra work is
rejected `BUSY`, and pre-cancelled work is rejected `CANCELLED`. Initialization
and execution have a bounded controller timer, with a monotonic deadline check
on returned results; killing a blocked worker is not a proof of bounded OS
memory reclamation. Abort or an operation error closes the entire mount.

`oci-verified-mount.test.cjs` exercises the source-built runtime in real
Chromium under the isolated CSP. Intersecting two 10 mm cubes offset by 5 mm
gives bounds x=5..10 and signed triangle volume 500 mm³; union gives x=0..15
and 1500 mm³; first-minus-second gives x=0..5 and 500 mm³. The test also covers
two independently verified byte mismatches, stale/foreign/same handles,
nonfinite and malformed requests, unsupported operation, shape budget, worker
termination, and timeout, cancellation and crash using explicitly identified
test doubles. The test does not establish general Boolean robustness, numerical
tolerance accuracy, negative-volume diagnosis, per-shape disposal, process
memory bounds, global multi-tab admission or a production release. Full OCCT
and Manifold upstream library capability inventories remain open.

For the isolated test, prepare the same pinned fixture as above and copy
`oci-verified-worker.js`, `oci-verified-mount.mjs`, `contract.mjs`, `inventory.mjs`,
`worker-controller.mjs`,
`oci-lifecycle-double.js`, `oci-crash-double.js` and
`oci-operation-crash-double.js` into its `static` directory. Start
`strict-csp-server.py` with `CODI_ENGINE_TEST_ROOT` set to that fixture and
`CODI_ALLOW_BLOB=1`, then run `oci-verified-mount.test.cjs` against its loopback
port and a dedicated Chromium debugging endpoint.

## Separate verified Manifold worker research mount

`manifold-verified-mount.mjs` shares the versioned request, handle-ownership,
single-pending-operation, error and controller-lifetime protocol with the OCI
experiment through `worker-controller.mjs`. Its representation is explicitly
`manifold-mesh-worker-owned`: it uses Manifold's mesh kernel directly and is
not a JSketcher Native BREP shell, an OCC BREP or a cross-engine conversion.
It supports the same positive millimeter box and union/common/subtraction
commands, and does not promise that the engines agree on all geometry or
tolerances. Machine-readable descriptors name distinct handle and result
schemas. Values, body identity and host integration remain unqualified outside
the narrow tests here.

The trusted bootstrap verifies source-built Manifold JS SHA-256
`cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b`
and WASM SHA-256
`7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d`,
then imports verified JS bytes with a temporary Blob URL and supplies verified
WASM bytes to it. Bootstrap trust, same-origin loading, scoped CSP, timeouts,
no-queue policy and eight-created-object lifetime budget have the same limits
as the OCI experiment. This is not an installation or production CSP change.

Manifold distinguishes an empty result (zero vertices, triangles, components
and volume, null bounds) and may return several topologically disconnected
components. Component count is not a manufacturing-part assignment. The worker
calls `delete()` on each disposed Manifold wrapper and confirms `isDeleted()`;
it also deletes temporary translated cubes and decomposition wrappers. This
establishes wrapper deletion in the tested runtime, not immediate reduction of
process or WASM linear-memory size. The OCI experiment retires a handle
logically and frees its interpreter only when the whole worker terminates.

The strict-CSP Chromium control verifies the two pinned runtime bytes,
overlapping-cube box/common/union/subtraction bounds and volumes, an empty
intersection and subtraction, a disjoint two-component union, preservation
of other operands after deletion, versioned operation labels despite caller
mutation, and foreign/stale/cross-engine handle refusal. Wrong runtime bytes
fail closed. Timeout, abort, startup/operation crash, deletion failure and
no-queue behavior use clearly labeled controller test doubles. Actual worker
targets disappear on close; that is not a memory-reclamation measurement.
The previous OCI real-runtime workflow is rerun against the shared controller.
Nontrivial topology, tolerances, memory peaks, crash recovery, global budgets,
asset custody, source/notices and the full underlying library inventory remain
open. This code is not connected to CAD or the desktop.

For a disposable fixture, add `manifold-verified-mount.mjs`,
`manifold-verified-worker.js`, `manifold-delete-failure-double.js`, and the
two exact source-built Manifold assets as `static/manifold.js` and
`static/manifold.wasm` to the OCI fixture described above. Run
`manifold-verified-mount.test.cjs` against that isolated strict-CSP server and
Chromium endpoint, then rerun `oci-verified-mount.test.cjs` with the shared
controller. No runtime asset is checked into this repository.

### Clean centered-hole worker runtime (November 4)

The default worker build now takes the separate clean runtime from
`node_modules/.cache/codi-oci-clean`, installed with the six-input
`build/prepare-webos-runtime.cjs` recipe in `docs/WEBOS-REPRODUCIBLE-BUILD.md`.
The verified OCC descriptor advertises `solid.profile.centered-through-hole`
only for its exact clean runtime pins. This remains a scoped research operation;
Native Mesh and older worker configurations do not advertise it. Existing
main-thread OCC inputs remain separate. Historical hashes and test receipts
above describe their original runtimes. Source and notice closure requirements
are recorded in `docs/research/CENTERED-HOLE-CLEAN-RUNTIME-20261104.md`.
