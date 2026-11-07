# Headless empty-sketch factory research

`makeEmptySketch` constructs a strict sketch-v3 record using the existing
headless workspace and IO serializer. It runs only in a disposable Worker so
its sketch generator state cannot affect an open editor. It records a copied
right-handed orthonormal face frame and an empty boundary for a principal datum
plane; it does not create a plane, publish a document or validate that a frame
actually belongs to a particular CAD face. The transaction caller must obtain
that frame from the privately evaluated face and recheck its document identity.

The isolated browser test bundles a test-only Worker, loads the actual `verb`
bundle without a DOM/canvas/window shim, creates sketches for three frames,
validates and strictly reloads/reserializes them, and rejects invalid units,
frames and nonfinite values. No production Worker entry, app command or
packaging has been changed. Test worker build uses the existing CSP-safe
numeric precompile and `test/webos/webpack.empty-sketch-factory.cjs`.

The frame is copied from own enumerable data properties only. Arrays must be
exactly dense triples, finite and bounded by 1e9; right-handed orthonormality
is checked to 1e-9. Sparse arrays and accessors are rejected. These checks
validate numerical shape, not face ownership or provenance.

`makeRectangleDraft(unit, frame, origin, width, height)` is a separate
research-only prepared sketch, limited to the principal XY basis and millimeter
coordinates. The two-dimensional origin and resulting vertices are bounded by
1e8 mm; both dimensions must be finite and between 0.001 and 1e6 mm. It uses
four deterministic authored segments and existing coincidence, orientation,
point-lock and driving-length constraints, strict sketch IO, and the existing
headless residual-checked solver. It returns the solved sketch and evidence;
it does not publish a plane or document, reserve production IDs, expose a host
command, or establish equivalence with the interactive editor. Publication must
bind face identity, revision, and document lifetime separately.

`rectangle-draft-browser.test.cjs` exercises the actual isolated Worker under
CSP, validates dimensions independently from solver output, checks residuals,
strict sketch and native JSON envelope roundtrips, deterministic IDs, caller
mutation after dispatch, numerical bounds, and rejection of malformed inputs.

The production worker task is tested by `rectangle-solve-worker.test.cjs`
through the unmodified `runSketchSolve` client. Compile the production worker
using `build/webpack.headless-sketch-worker.cjs`, and the existing client helper
using `test/webos/headless-sketch-client.config.cjs` with an isolated output
path. Serve those as `static/worker.js` and `static/client.js` with app-local
`lib/verb.js`, using `rectangle-worker-fixture.py`. The test exercises the
actual disposable worker under CSP, including existing no-task solve behavior,
invalid inputs, revisions, real active worker cancellation and termination.
