# Codec/validation component; application integration blocked

Product `e3e6686c0` changes only `projectEnvelope.mjs` on the contract base
`8b8adfc7b39d968e026c2078d971d62cf8cd6d37`. The production validation Core and
Worker wrapper require no functional changes: Core already invokes this codec
inside the Worker and returns the entire validated original value. Actual Worker
tests exercise that path, including model/sketch-only storage projection.

**Do not stage this component alone in a runnable app.** Its codec now accepts
v3, but current manager restore does not retain drawing metadata, ordinary Save
and manufacturing Save both silently emit v2 without it, and the outer host
`supportedEnvelope` still admits only v2. Manager custody/retention and outer
whitelist/dirty/baseline support must be integrated together, followed by actual
native Save/fresh Open proof. Neither source acceptance nor this component packet
is authorization to publish drawing edits.

`manager-retention.integration.test.mjs` is intentionally normative and RED on
this branch: both actual-manager Open→Save controls fail at saved.version 2 vs3.
They use an empty structural project and synthetic unresolved definition; there
is no successful native geometry or authored part claim. The actual validation
and, where applicable, manufacturing hash Workers execute. The failures must turn
green through real manager retention, not changed expectations or hidden seeding.

Signatures for the manager integration:

```js
encodeProjectEnvelope(project, manufacturing=null, presentation=null, drawing=null)
// v2 when drawing===null; v3 with drawings:[capturedDefinition] otherwise
decodeProjectEnvelope(v2) // EXACT previous return shape; drawing absent
decodeProjectEnvelope(v3) // existing fields plus drawing:capturedDefinition
```

The v2 return shape deliberately remains exact for existing consumers; manager
uses `decoded.drawing || null`. This refines the earlier contract sketch's
unconditional drawing:null return. Codec never resolves references, changes
source/history, or introduces measured facts. Valid missing target/source/build
references survive Worker validation exactly as unresolved intent; current part
membership is a later independently guarded read/publication responsibility.

Coverage includes detached immutable definitions, unchanged default v2 encoding,
missing/null/extra/multiple/sparse arrays, symbols/hidden fields/prototypes,
getter-free v3 envelope/list/definition admission, invalid physical metadata,
64KiB definition budget, unchanged global tree limits, inch coexistence and
unchanged geometry/manufacturing digest domains. Existing 21 display-unit tests
run unchanged. Actual v3 Worker positive/malformed/unresolved controls carry no
Native/HLR/reference-resolution claim.

Reproduce the component and retained suite:

```sh
/tmp/codi-files-move-node/bin/node test/linked-part-drawing-persistence/build-validation.cjs
/tmp/codi-files-move-node/bin/node --test test/linked-part-drawing-persistence/codec-worker.test.mjs test/display-units/quantities.test.mjs test/display-units/manager.test.mjs
/tmp/codi-files-move-node/bin/node --test test/linked-part-drawing-persistence/manager-retention.integration.test.mjs
```

The final command must currently exit1 with two retention failures. Source-bound
logs, compiled Worker pin, build and TypeScript outcomes are frozen under
`component-evidence/`; `run-component.mjs` refuses to overwrite the receipt.
The historical BEFORE controls/raw failures remain byte-unchanged and should
not be run as current component acceptance. No PM/Craft/host source was edited.
