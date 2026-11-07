# Experimental dependent plate regeneration

This branch is not a release candidate. The current centered plate test creates
100×50×20 mm geometry, a center hole related to two boundary-linked construction
diagonals, and four corner holes with eight 10 mm point-to-boundary relations.
It edits the original sketch to 150×30, checks sketch undo/redo, five resulting
hole rays and old-hole locations, and saves/reopens the native v2 project.
The worker solves a restricted single-stage point/segment/circle sketch against
referenced line boundaries; unsupported or ambiguous cases must fail.

The combined `aff1befe` application now passes the impossible 15×15 control:
the previous complete solid remains displayed with a stale notice, saving and
3MF export refuse the invalid revision, and a corrected 150×30 edit regenerates.
This supersedes the earlier partial-solid publication failure; keep its test.

The caller checks face/frame, sketch bytes, parameters/history, exact project
service and monotonic document generation. Actual validator/reset, held replay,
service replacement and late-result controls pass. In-place open/cancel
preserves stored sketch bytes; the legacy separate 2D-tab path remains a review
item. See `docs/DOCUMENT-LIFETIME-REPLAY-20261104.md` for exact integrated
source, asset hashes, independent lead tests and remaining limitations.

Only referenced lines are included in the worker request; all referenced IDs
must resolve, while unrelated face arcs are excluded. The worker owns a bounded
single-use job, strict data parsing, typed failure and residual/admission checks.
The caller currently rejects sketch strings above 1 Mi UTF-16 code units, a
compute-admission cap, not the My files 128 MiB input limit. Changed supporting
face frames and ambiguous edge direction/topology are conservatively refused.
The test covers a bounded supporting-line/sketch/solid path; it does not qualify
all geometric references, CAD tools, finite-edge conditions, fillets, patterns,
manufacturing, or the full Gate 1.

Build with `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 npm run build`, then
build `test/webos/webpack.config.cjs` with the same flags. Serve `dist` on a
loopback HTTP server with the production-style CSP (no `unsafe-eval`), and run
the browser tests using loopback `JSKETCHER_TEST_URL` and `CODI_TEST_CDP`.
`plate-parametric-centered-browser.test.cjs` is the successful bounded case;
`plate-parametric-last-valid-browser.test.cjs` checks last-valid geometry after
a failed revision. Test workers/helpers are not public assets.

### Reconciled replay

Private replay and document-lifetime guards are integrated with normalization,
feature-ID allocation and CAD worker admission. The application build and
plain typecheck pass. The combined runtime preserves accepted registry/model
objects while a candidate is held, and rejects late results after replacement.
This is scoped evidence, not proof that every operation's captured services or
native handles are isolated, or that a noncooperative kernel can be interrupted.
The full feature chain remains open. Desktop `73c1e8b13` now packages
`d3d36bc5` and independently qualifies signed small models and this plate with
an ordinary corner fillet at phone/1080p/4K. The separate fillet/chamfer wizard
and explicit Native refusal tests pass against the packaged runtime. Read
`plate-fillet-pattern-README.md`; the name does not imply that an associative
feature pattern exists. Units, feature patterns, bracket/enclosure and the full
shared-agent gate remain unfinished.

The historical `089ed178` prototype and intermediate `b2c3f6c1` owner evidence
are superseded by the combined lead results. Do not apply their older trees
over the integration branch or treat the former missing declaration/lifetime
hook as still unimplemented.
