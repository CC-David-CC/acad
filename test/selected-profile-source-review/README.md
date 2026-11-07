# Independent selected-profile source preparation controls

Pure, nonvisual geometry preparation review. No constraint solve, native engine,
public command, rendering, history or save/reopen qualification is claimed.
Fixtures construct native-v3 data with one empty generator-free stage; their
geometry is supplied explicitly, not presented as Worker-solved geometry.

`adversarial.test.mjs` copies the candidate module into a uniquely owned
temporary directory with the three exact tracked dependencies. It imports the
actual module and deletes the temporary tree after testing. The candidate
product module is **not duplicated in this commit**. Each execution prints SHA256
and byte pins for all four input files. Set `CODI_SELECTED_PROFILE_CANDIDATE` to
the module being reviewed:

```sh
CODI_SELECTED_PROFILE_CANDIDATE=/path/to/selectedSketchProfile.mjs \
  node --test test/selected-profile-source-review/adversarial.test.mjs
```

Base tracked source: `a27040f58e34dcdb960864cfc941fda9879f3053`.
Dependencies use that tree. Test fixtures derive canonical descriptor IDs from
their explicitly authored IDs; they do not call the production region discovery
helper to manufacture expected geometry. Area/volume and oblique bounds are
independent analytic or eight-vertex transform oracles. The 64 traversal cases
vary source order and every edge direction. No tests are skipped or expectations
weakened after observing the candidate.

## Baseline finding

Candidate `a9eb949c6c08d7ca3c7fb2f8e44ae4ff4df85e1e85680b582032b90eb51fc788`
(7510 bytes) includes the integrator's 512-segment guard.

Initial 14 controls: **13 pass / 1 fail**. Expanded final test source against
that same candidate: **15 pass / 2 fail**. Both failures expose the same defect:
source admission checks only UTF-16 `sketchJSON.length`, while existing
`candidateSketchStorage.mjs` checks both code units and encoded UTF-8 bytes at
1 MiB. A source containing an ordinary valid rectangle and metadata string
`'界'.repeat(400000)` is below the code-unit cap but above the native storage byte
cap and is incorrectly accepted. The exact-boundary test independently proves
that a multibyte source one UTF-8 byte over cap is also accepted. ASCII overcap
already refuses.

The defect was reported to the integrator with the concrete source hash before
their correction. Requested bounded repair: encode once before asynchronous
digest, refuse encoded bytes over 1048576, reuse that exact buffer for the real
digest, and do not rewrite source text. Original failing logs are retained under
`evidence/`.

## Corrected candidate

Integrator commit `e67f2ea2acf8c76b56dd9c7f72095c3858cc980d` applies exactly the
requested byte admission correction. Candidate module SHA256:
`f0b594e7fd93382bd328b4e60e3cc96d47f74b43cad2ce89f50add94a881c9f0`.
The unchanged final 17-test source passes **17/17** locally and on R730. The
same final test source run against the retained original candidate reproduces
**15/17** on R730, with the same two byte-limit failures. All source pins are
printed in each retained execution log; no failed assertions were disabled or
weakened. These runs use real SHA256 and actual imported preparation/dependency
modules; they do not use a solver, kernel, browser or test loader transformation.

R730's fixed 128-circle and 128-rectangle controls complete within the retained
single-run timings. Source bounds are finite: at most 4096 source objects, 512
ordinary segments before the sorted endpoint walk, 128 closed contours,
1 MiB UTF-8 source, plus the common planner's selected boundary/hole/curve and
coordinate caps. The endpoint walk repeatedly sorts remaining segments, and
region classification is pairwise. Current caps bound that work; this review
does not establish a scalable unbounded algorithm or browser latency target.

No additional concrete geometry/binding defect was demonstrated in this bounded
corpus. That is not general preparation/parametric/public qualification. In
particular, the caller must still bind this source to a current successful
genuine sketch Worker result and retain ownership through native publication.

## Scope and controls

- Exact closed rectangle traversal through all 64 source-order/reversal cases;
  no mutation of source/request, no near-rectangle projection.
- Independent selection of disjoint regions, immediate-child nesting of three
  circles, mixed rectangle/circle nesting and separate holes.
- Exact face/descriptor/member/canonical-order binding, source digest mismatch.
- Held **genuine** SHA256 result while caller mutates original input/frame;
  accepted detached values remain original and returned data is recursively
  frozen. This is digest-capture proof, not Worker/currentness proof.
- Extra fields/accessors/sparse frame refuse without getter execution;
  source frame/stage/duplicate identity refusals.
- Tiny real gap, trapezoid, duplicate/branch, crossed unselected boundary,
  touching/intersecting/coincident ordinary contours refuse explicitly.
- Radius/depth/finiteness/resolution boundaries; analytic oblique-frame bounds.
- 128 circle contour and 512 segment/128 rectangle endpoints accept; next
  contour/rectangle and 4097 objects refuse. Global ID overflow refuses instead
  of truncating authored identity. Measured duration is an observation, not a
  general complexity/performance guarantee.
- ASCII and multibyte exact UTF-8 byte boundary and overcap controls.
- Native full-sweep Arc remains explicitly unsupported by this adapter; its
  source is not silently rewritten into a Circle. Full-circle native Arc support
  elsewhere does not imply adapter coverage.

This preparer intentionally does not establish constraint consistency or reject
arbitrary unsupported expression semantics: a genuine successful, current
headless solve and source binding are prerequisites owned by its caller. It also
does not authorize source edits, maintain document currentness during native
evaluation, close kernel owners, or establish native geometry correctness.
