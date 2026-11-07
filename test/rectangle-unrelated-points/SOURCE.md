# Rectangle dimensions with independent Points

Source-only repair based on Core `2d90d1bc96ab7264f7b910f266af68fcb2d1d51f`.
No per-step test, TypeScript, build, or browser run accompanies this checkpoint.
The complete unchanged E06 workflow is the qualification target after composition.

## Observed failure

The retained complete-workflow receipt at
`/tmp/codi-sketch-primitive-removal-signed-proof-r1/receipt.json` failed with
`One same recovered rectangle required: 0 !== 1`. Its actual saved sketch
`same-recovered.jsketcher.json` contains the four original `rect-0` through
`rect-3` Segments, their original eleven constraints, and one independently
retained ordinary Point at `(7,9)`. The workflow had already completed duplicate
removal, mixed travel, extrusion creation Undo/Redo, and Save/sync/fresh Open.

`authoredRectangle` required exactly four total objects. Two related assumptions
also needed repair: travel treated every object as a Segment, and solved lengths
were located by object-array position. Merely relaxing the total count would
leave those paths inconsistent and would not verify unrelated Point retention.

## Changed source contract

Only `web/app/cad/craft/rectangleEditing.ts` changes production behavior:

- Resolve exactly one ordinary, stage-zero Segment for each existing canonical
  rectangle ID. Preserve the original numeric driving-dimension bounds, source
  size, stage/generator/boundary restrictions, and real solver admission checks.
- Check the original positive-X/positive-Y rectangle corner arrangement against
  its two driving lengths with the existing `1e-6` coordinate/length tolerance.
  No coordinates are snapped, rewritten, or inferred for publication.
- Admit additional ordinary stage-zero Points only. Refuse any constraint that
  joins a rectangle object/endpoint reference to an unrelated object. Independent
  Point constraints remain in the full sketch and are solved normally.
- Normalize only the four rectangle endpoints for journal comparison. All other
  source records and constraints must match across travel snapshots exactly.
- After solving, compare complete unrelated object records exactly; any Point
  coordinate or metadata change rejects the edit before storage preparation or
  replay publication. Keep existing exact stage and object-roster checks. The
  real solver also preserves dimensions, labels, constants and source metadata.
- Revalidate the solved rectangle and locate its edges by canonical IDs for
  dimension and travel verification. Shared replay, history, journal, revision,
  source lifetime, storage and cancellation paths remain in use.

## Complete-workflow acceptance still required

The unchanged E06 driver must discover the recovered rectangle, edit its driving
dimensions, replay the actual dependent extrusion, travel Undo/Redo and complete
normal Save/sync/fresh Open while retaining the unrelated Point `(7,9)` and its
complete source/constraints exactly. No successful geometry claim is made here.

Unrelated ordinary curves, construction geometry, coupled Point constraints,
arbitrary rectangle IDs/orientations, and broader mixed-open/closed profile
discovery remain outside this narrow repair. They are not silently removed or
classified as qualified. Queued E01 source changes are separate and held.
