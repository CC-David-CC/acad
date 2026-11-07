# Lead verification of the isolated mount prototype

## Current combined result

Integration `6486b1ef969915ef0385d99207fcfac1a1d74b65` adds verified
multi-operation OCI and Manifold workers and their shared lifecycle controller.
The lead independently ran both real Chromium suites and four contract unit
tests. All passed. `test/webos/combined-pattern-mount-evidence-20261104.json`
records the source, output, log hashes and limits alongside the separate CAD
regressions. These mounts still are not connected to the desktop application.

Both workers correctly measured intersecting 10 mm cubes offset by 5 mm:
common volume 500 mm³, union 1500 mm³, subtraction 500 mm³, with their expected
bounds. Manifold additionally returned verified empty results and a two-component
disjoint union. The OCI adapter explicitly refuses zero-face results; it does
not claim that zero faces establish a valid empty solid or that any nonempty
result is exactly one solid. Foreign/stale/cross-engine handles, malformed or
nonfinite inputs, byte-integrity failures and the declared resource limits are
covered. Preserve these differences instead of silently changing engines.

The workers hash the actual JS/WASM bytes they load; their bootstrap,
controller and expected hashes are trusted host inputs. The isolated test policy
permits Blob script imports and WASM compilation, without JavaScript
`unsafe-eval`. This does not change or qualify production CSP/loading. The
eight-created-name OCI limit is a provisional research bound, not a library
limit. Logical handle disposal does not free its native named shape. Manifold
uses the library's owned deletion methods; neither result promises immediate
OS memory return. Global admission, broad bindings, installed source/notices,
document transactions and explicit engine composition remain open.

The cleanup audit found real problems in the original interpreter wrapper:
duplicate name allocations on overwrite, inserted borrowed keys on missing
lookups, unsafe unknown-command dispatch, and unowned interrogation allocations.
Curve/history name tables also retain borrowed command strings. This is why
the current box/Boolean worker proof must not be generalized to curve commands
or long editing sessions. No guessed native pointer free is permitted.

The repair source is now maintained only on LAN:
`example.invalid:/srv/data/git/occt-interpreter-codi.git`, backed by
`r730:/mnt/data10tb/git/occt-interpreter-codi.git`. Source `5c353d62` has a
successful full Emscripten build and agent-run real-runtime tests for its bounded
name/dispatch/Boolean repair. Follow-up `eac17723` owns additional model-name
tables and is being built and qualified separately. Interrogation-session
cleanup remains a distinct unfinished task. These are test artifacts, not new
application runtime pins. See the `research/occ-cleanup-audit-20261104` branch
for exact build controls and evidence before using either artifact.

## Earlier single-box prototype

Source `1a6e5b77b240cc48c6f851e23992e1763f2e08d1`, retained by integration
merge `7d08c159`. This module is not imported by the packaged desktop CAD app.

The lead independently ran these bounded tests on 2026-11-04:

- Five Node tests: four contract checks with controlled adapters, plus an actual
  source-built Manifold 10×20×30 box, volume 6000 and exact bounds/disposal.
- A strict-CSP Chromium OCI worker test, with independently hashed wrapper and
  WASM, six faces/twelve triangles/expected bounds, owned handle refusals,
  cancellation and actual worker-target removal on disposal.
- The unmodified wrapper negative control: real dedicated-worker loading
  fails because `window` is not defined. No DOM or fake-window shim was added.

Node was 24.22.1 and Chromium 155.0.8059.79. The fixtures, source hashes and
reproduction steps are in `modules/engine/mount/README.md`. Whole-worker
termination does not prove per-object free or immediate process-memory return.
The portable JS is a deterministic wrapper derivative with unchanged WASM,
not a newly rebuilt or publication-qualified interpreter. Runtime provenance,
trusted mount loading, general capability coverage, resource admission,
fine-grained cleanup, CAD integration and engine composition stay open.

The current desktop app remains pinned to `d3d36bc5` with the existing runtime;
do not substitute this prototype or use it to publish authored document state.
