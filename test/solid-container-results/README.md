# Common native result source controls

Fourteen focused/existing tests and full TypeScript checking pass. These use real common model/ledger/inspection classes with controlled provider records; they are not browser/native-kernel qualification. No canvas or fake browser is used.

```sh
node --test test/solid-container-results/*.test.* test/smlib-integration/solid-metrics.test.mjs test/smlib-integration/solid-ledger.test.mjs test/smlib-integration/metrics-inspect.test.cjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
```

Node must be on PATH because esbuild-wasm launches it. Tests cover empty MObject metadata (not MShell), private empty operands in a later Boolean, complete compound selection, provider-specific/unknown counts, null unavailable nonmanifold volume, modern Float32 custody transfer above512 triangles, retained nonempty outputs with unavailable display, and existing lifetime/provenance/reentry behavior. The old ledger fixture gains the private display descriptor; assertions are unchanged.

History schemas and v1 opaque feature IDs remain unchanged. Empty receipts use outputId/resultKind/bodyId:null; inspection outputs includes empty while bodies excludes it. No per-region IDs or manufacturing grouping are invented. Modern Worker display buffers transfer into private model custody without main-thread conversion/validation loops; legacy Float64 conversion remains a temporary512-triangle path. Root owns matching provider/catalog/app integration and actual browser history/save/native replay qualification.
