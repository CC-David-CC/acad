# Worker prism reference and generated-face guards

The actual projection/registry Worker test constructs a real OCC-authored
rectangle prism, projects it to `MBrepShell`, and resolves real model IDs
through `EntityType` and `initializeBySchema`. Transient connector-edge and
vertex references fail with `TRANSIENT_REFERENCE_UNSUPPORTED`; authored edge
references remain usable. It also runs the existing semantic and projection
tests. This exercises schema resolution directly, not full native history
replay of a published worker prism (publication remains unsupported).

The rendered WebOS browser test uses real legacy plane models and marks one
face's root as worker-owned solely to check entrypoint wiring. It verifies
sketch, direct in-place entry, 2D boundary persistence, DXF boundary write,
and reassignment source/target refusal before mutation, including preservation
of an already-open editor, then verifies ordinary legacy editor/reassignment.
This synthetic metadata case does not replace the real projected-model test.

The separate native restore browser test uses both JSON and Blob APIs: a
1024-character quoted worker-style sketch ID survives without truncation, and
1025 characters are refused before import. It does not claim generated worker
faces can be sketched or that transient references are durable.

Tests passed on a private full app built from the 91c8d95c base plus helper
932f0fbd and these source changes, using real local Chromium. App bundle SHA256
`d857f520238283ff93d74428f685d662ba2e2f28b876da3272652a369678dd03`; sketcher
bundle `7fe5931ec9e089e8de56725cc256be54946ae47466423e230d002294fba4cda4`.
`tsc --noEmit` passed. Commands:

```
node test/prism-reference-gates/browser.test.cjs
node test/webos/worker-face-reference-gates-browser.test.cjs
node test/webos/project-sketch-id-boundary-browser.test.cjs
```

The first runs with a freshly built `test/prism-reference-gates/webpack.config.cjs`
Worker and the isolated engine fixture described in `test/engine-extrude/README.md`;
the WebOS tests run against the separately built full app. All use isolated
loopback browser/CDP endpoints and the existing Puppeteer dependency.
