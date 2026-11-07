# Candidate and public worker-model registry checks

The registry preflights a complete temporary index before replacing candidate
or public projections. A collision is rejected when either distinct object
belongs to a `root.ext.workerGeometry` model, independent of traversal order;
repeated traversal of the same object is allowed. Legacy-only duplicate IDs
retain their previous last-entry behavior and are **not** claimed safe. Worker
body/face/durable-edge IDs must be nonempty strings of at most 1024 characters;
only explicitly marked MEdge/MVertex transient identities are exempt from the
durable bound. This does not itself prevent selection or serialization of those
transient entities: the separate reference gate remains necessary.

For a worker face, candidate and public projection reject non-null saved sketch
bytes or in-memory sketch content. They never call `readSketch` or silently
remove those bytes. Worker-owned projection caching is not reused without a
fresh check, including if the same model array is modified in place. Candidate
and public `reindexFace` preflight a copy, then update the existing map only
after success. Sketching on generated worker faces remains unsupported.

`browser.test.cjs` uses an actual production sketch Worker, pinned OCC Worker,
verified mount, semantic derivation, projector and real CAD registry code in a
strict-CSP no-DOM Worker. Tests exercise worker-vs-legacy collisions in both
orders, two worker models, duplicate traversal of one object, durable body/
face/edge 1024/1025 boundaries, later candidate/public collisions, same-array
cache invalidation, empty-but-present saved bytes and in-memory sketch refusal,
unchanged accepted candidate/public maps on failure, candidate/public reindex
collisions and preserved candidate map identity after a valid reindex. It also
checks the documented legacy-only overwrite behavior. The minimal fixture
storage is a Map; this is not a signed My files or craft transaction test.
The existing projection Worker fixture now explicitly provides
`getSketchData:()=>null` to represent an empty sketch store.

Build with `webpack --config test/worker-registry-safety/webpack.config.cjs`,
copy the generated Worker to `static/worker-registry-test.js` in the isolated
OCC fixture from `test/engine-extrude/README.md`, and run the browser test with
loopback Chromium/Puppeteer. The existing `test/prism-model-projection` browser
suite is a separate positive regression. No production release is implied.

`combined-evidence-20261104.json` records the combined `613c2cf3` build
(tree-identical to `9bb3eae0`), actual Chromium checks and pinned asset hashes.
`run-combined.py` extends the existing engine-resource runner with explicit
`--projection-worker` and `--registry-worker` input paths and the registry,
projection, face-reference and OCC push-status tests. It creates and cleans a
disposable loopback fixture; see its `--help` for the original runtime/Node/
Chromium arguments. The runner itself was retested for registry and projection.
The full ten-check receipt used the equivalent temporary runner with the same
two built Worker inputs. The first private build attempt failed due to symlinked
CSS paths and a missing private Manifold cache; a copied dependency tree with
its own cache yielded the recorded clean build. A registry collision currently
raises a plain `Error`, not a dedicated typed error code.
