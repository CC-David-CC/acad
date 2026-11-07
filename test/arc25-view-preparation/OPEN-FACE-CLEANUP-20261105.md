# ARC25 narrow open-face allocation and owner cleanup checkpoint

This is a derived-view correctness/allocation fix, not completion of ARC25 or a
new scene-publication protocol. The editable document, geometry kernels, sketch
math, history source, visibility, and selection meanings are unchanged.

The preceding full-SwiftShader compositor trace localized two adjacent costs:
an approximately 195 ms publication microtask and a 152 ms rendering frame.
CPU samples put about 170 ms inclusive under `models$.nextGuarded` and about
148 ms under `viewSyncBundle.sceneSynchronizer`, constructing genuine
`OpenFaceShellView` / `OpenFaceView` / `SketchingView` objects. The next frame
spends about 140 ms inside Three rendering, including material program/uniform
preparation. These nested/instrumented durations overlap; they are not additive
CPU-share estimates. The original trace/profiles are backed up in the preceding
readback checkpoint. No broad cooperative staging system is implemented here.

## Two defects confirmed in the actual r7 app

1. `SketchingView` calls the virtual `updateSketch()` in its constructor.
   `OpenFaceView.updateSketch()` previously built bounds/geometry while its
   material was still absent, implicitly creating a temporary default material.
   The concrete constructor then assigned its actual material and repeated all
   the bounds/geometry construction, discarding the first mesh.
2. `OpenFaceShellView.dispose()` released its face child but never called its
   own base disposal. Old shell `ext.view` owners and their attribute-stream
   subscriptions therefore remained after ordinary history replacement.

`view-allocation-probe.cjs` discovers the real view prototype after an actual
2000-PLANE native restore and forwards its existing methods while counting calls.
It uses public history travel to 1000 models and back to 2000, preserving the
complete 2000-record history. Baseline source is `b249b5afb`, actual r7 app
SHA-256 `e8d809e7f6775c0e0e331ab874d3197e7ab61c4f231e349401ef597719c3ed65`.

| Actual full-tip rebuild | Baseline | Candidate |
|---|---:|---:|
| Authored models/history/root views/face views | 2000 each | 2000 each |
| Bounds/geometry constructions | 4000 | 2000 |
| Geometry constructions before material exists | 2000 | 0 |
| Previous face owners released | yes | yes |
| Previous shell owners released | no | yes |
| First shell attribute observers after restore → rewind → full | 1 → 2 → 3 | 1 → 1 → 1 |

The 1000-model rewind likewise changes 2000 constructions to 1000. This is an
exact call-count/resource-lifecycle comparison, not a statistical speed claim.

## Product changes

`OpenFaceView.updateSketch()` now defers its initial virtual invocation until its
material exists, and the concrete constructor calls it once after material
creation. Subsequent real updates still rebuild sketch and bounds normally.
Only `OpenFaceView` uses that guard; the other `SketchingView` subclass,
`FaceView`, retains its existing constructor behavior.

Both open-face constructors release owned resources if their remaining
construction fails. Disposal releases geometry, material, face subscriptions,
and root subscriptions even if an earlier release throws. The first cleanup
failure is preserved and additional failures are reported; constructor cleanup
always rethrows the original constructor error. Geometry is detached from its
owner before release, and disposal can safely be repeated.

The narrowly approved base `View.dispose()` guard clears `model.ext.view` only
when it still points to that view. It handles repeated/reentrant disposal and
finishes owner detachment when a disposal callback throws. It does not clear a
newer owner installed before or during disposal.

## Actual candidate qualification

The matched candidate is product source `6cfc7fe27`, built on R730 at
`/mnt/data10tb/codi-arc25-openface-20261105`, app SHA-256
`145ce7e1e6b959b534c05d5cab210f8efc9a9cc74318f09ccc3e9dde0093e535`.
Exact app/project-Worker pins are in `open-face/pins.json`. The build reuses the
frozen r7 generated Worker inputs and dependencies. Its temporary webpack config
sets `resolve.symlinks=false` so those borrowed directory paths retain the
repository's asset-loader include rules; that temporary build config is not a
product change. Actual Webpack compilation succeeded. It is a loopback fixture,
not a public-site deployment.

PASS:

- Actual 1000/2000-model travel gives exactly one geometry construction per new
  view, no pre-material geometry, all old root/face owners released, exactly one
  attribute observer per current root and face, unchanged complete history and
  source, and genuine registered/marked selection.
- Calling the actual current view's post-construction `updateSketch()` replaces
  and disposes its prior bounds geometry exactly once, preserves its material
  and unchanged coordinates, and retains the current owner/scene attachment.
- Ownership-only controls use the actual bundled base `View` with small plain
  model records. An older disposal retains a newer owner. A reentrant throwing
  release retains its original error, executes once and preserves a replacement
  owner. These are lifecycle unit controls, not CAD math or fake Viewer proof.
- An explicitly injected error after real geometry creation during actual
  history publication, plus errors from geometry, material and root release,
  disposes geometry/material once each, attempts root release once, clears both
  old owners and subscriptions, reports cleanup failures, and preserves the
  original construction exception. Removing the injection and repeating normal
  history travel restores all 2000 models/views with one observer each.
- A real classic OCCT BOX creates six ordinary `FaceView` instances; rewinding
  releases their six geometries/materials and all root/face subscriptions while
  preserving its one-record history. This checks the other constructor path.
- The actual complete 2000-model restore and existing timeline controls pass:
  immediate full model/view/registry availability, scrolling, selection through
  row unmount/remount, 1000 ↔ 2000 travel, resize, stale RAF and real React
  unmount/remount cleanup. No model is hidden or truncated.
- The candidate's existing 700 ms cancellation control passes unchanged: no
  accepted model/history or storage/source writes, zero resource categories and
  a terminated actual project Worker after rejection.

The injected view-construction failure is **not** a proof of atomic rollback of
the derived scene. Authored state can already be committed when an observer
fails. This test establishes cleanup and successful explicit reevaluation; a
transactional staged-view protocol remains separate work requiring its own
ownership/cancellation design.

The candidate restore observation is 2263 ms with a 293 ms maximum sibling
10 ms timer gap on the owned CPU SwiftShader compositor. All 2000 authored
models/root/face views exist immediately at acceptance. That is still a sizable
main-thread stall: **ARC25 remains partial**. Cold material/program preparation,
view publication and drawing still need bounded work. The accepted open document
retains its reported engine resources; cancellation is the case asserting all
resource categories become zero. No physical hardware-GPU, phone or release-wide
performance claim is made.

Reproduce with the exact loopback runtime and owned composited CDP:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:20504 \
CODI_TEST_CDP=http://127.0.0.1:20503 \
CODI_EXPECT_APP_SHA=145ce7e1e6b959b534c05d5cab210f8efc9a9cc74318f09ccc3e9dde0093e535 \
CODI_EXPECT_GEOMETRY_MULTIPLIER=1 CODI_LIFECYCLE=1 \
node test/arc25-view-preparation/view-allocation-probe.cjs
```

Use `CODI_EXPECT_GEOMETRY_MULTIPLIER=2` and omit `CODI_LIFECYCLE` for the baseline
allocation comparison. `solid-view-smoke.cjs` checks the ordinary solid-face
subclass. Existing `restore-browser.cjs` accepts the candidate app pin and
`CODI_COUNT=2000 CODI_TIMELINE=1 CODI_READBACK_PROBE=1`; use
`CODI_CANCEL_MS=700 CODI_ASSERT_ABORT=1` without timeline controls for interruption.
Compact receipts live in `open-face/`; private raw profiles/logs are backed up
on R730 at `/mnt/data10tb/codi-evidence/arc25-openface-20261105/`.
