# Linked drawing metadata publication source checkpoint

This change enables one persisted authored linked-part drawing definition through the existing manufacturing preparation Worker, authenticated private capability, PM participant, and Craft A/J/T transaction. It adds no journal or geometry executor. Definition capture/equality/charge and metadata travel validation run in the preparation Worker. The UI recaptures only the schema-bounded 64KiB drawing clone into truly frozen data; manufacturing payload ownership remains private and alias-excluded.

Manager methods:

- `inspectLinkedPartDrawing()` returns document `revision`, geometry `geometryRevision`, immutable `definition|null`, readiness and `quality:'authored-definition-only'`.
- `applyLinkedPartDrawingOperation(request, options)` accepts the existing exact `drawing.create|replace|remove` schema. Both inspected revisions are required. Semantic/source/native reference resolution is deliberately separate; valid unresolved intent can persist.
- `travelLinkedPartDrawingMetadata({revision,direction}, options)` is reached through the existing Craft `travel-authored-edit` dispatcher, not a new Undo stack.
- `exportLinkedPartDrawingSvg(options)` captures the actual manager/document/definition/geometry and calls root's private Worker SVG helper. It publishes no state or file; authorized host file publication remains separate.

Drawing install changes only definition, drawing revision, document revision, and the single journal. Material assignments and the material/full-tip token stay unchanged. No-op preserves all tokens and the redo tail. Publication preallocates its receipt/revisions/fingerprint, then installs J and PM fields without a callback before notification; postcommit notification/lifetime failures stay committed. Metadata travel performs no Native evaluation. Existing pure snapshot and per-activation manager authority remain in place. Native v3 envelope retention is inherited from the composed baseline.

Dependency: root `8dacad359` (`workerLinkedDrawingSvg.ts`), locally cherry-picked as `9779f16d1`, is not part of the publisher source commit. Lower Native drawing observation and actual factory assets are separate root/Gate work. No tests, TSC, builds, browser runs, services, or deployments were launched for this source-only checkpoint, per the user's requested end-to-end verification order. No geometry, measured dimensions, rendered SVG or Save/Open success is claimed here.
